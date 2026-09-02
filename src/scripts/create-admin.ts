import 'dotenv/config';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { User, UserSchema, UserType } from '../users/schemas/user.schema';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta la variable ${name}`);
  return value;
}

async function createAdmin() {
  await mongoose.connect(required('MONGODB_URI'));
  const UserModel = mongoose.model(User.name, UserSchema);
  if (await UserModel.exists({ userType: UserType.ADMIN })) {
    throw new Error('Ya existe un administrador; no se creó otro');
  }

  const setupToken = randomBytes(32).toString('base64url');
  const unusablePassword = randomBytes(48).toString('base64url');
  await UserModel.create({
    id: uuidv4(),
    firstName: required('ADMIN_FIRST_NAME'),
    lastNameFather: required('ADMIN_LAST_NAME_FATHER'),
    lastNameMother: process.env.ADMIN_LAST_NAME_MOTHER?.trim() || '-',
    password: await bcrypt.hash(unusablePassword, 12),
    registrationNumber: process.env.ADMIN_REGISTRATION_NUMBER || 'ADM000001',
    phone: required('ADMIN_PHONE'),
    email: required('ADMIN_EMAIL').toLowerCase(),
    birthDate: new Date(required('ADMIN_BIRTH_DATE')),
    state: 'active',
    termsAccepted: true,
    userType: UserType.ADMIN,
    setupTokenHash: createHash('sha256').update(setupToken).digest('hex'),
    setupTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  process.stdout.write(
    `Administrador creado. Matrícula: ${process.env.ADMIN_REGISTRATION_NUMBER || 'ADM000001'}\nToken de activación (se muestra una sola vez): ${setupToken}\n`,
  );
}

createAdmin()
  .catch((error: Error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
