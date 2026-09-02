import 'dotenv/config';
import mongoose from 'mongoose';

const PROTECTED_ADMIN = 'ADM000001';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta la variable ${name}`);
  return value;
}

async function disableUsersExceptAdmin() {
  await mongoose.connect(required('MONGODB_URI'));
  const users = mongoose.connection.collection('users');

  const adminCount = await users.countDocuments({
    registrationNumber: PROTECTED_ADMIN,
  });
  if (adminCount !== 1) {
    throw new Error(`No se encontró exactamente un usuario ${PROTECTED_ADMIN}`);
  }

  const disabled = await users.updateMany(
    { registrationNumber: { $ne: PROTECTED_ADMIN } },
    { $set: { state: 'inactive' }, $unset: { refreshTokenHash: '' } },
  );
  await users.updateOne(
    { registrationNumber: PROTECTED_ADMIN },
    { $set: { state: 'active', userType: 'admin' } },
  );

  process.stdout.write(
    `${disabled.matchedCount} usuario(s) no administrador(es) verificado(s), ` +
      `${disabled.modifiedCount} actualizado(s); ${PROTECTED_ADMIN} permanece activo.\n`,
  );
}

disableUsersExceptAdmin()
  .catch((error: Error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
