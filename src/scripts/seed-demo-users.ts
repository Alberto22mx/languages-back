import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { User, UserSchema, UserType } from '../users/schemas/user.schema';
import { Groups, GroupsSchema } from '../groups/schemas/groups.schema';

const required = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta la variable ${name}`);
  return value;
};

async function seed() {
  if (process.env.NODE_ENV === 'production') throw new Error('El seeder demo no puede ejecutarse en producción');
  await mongoose.connect(required('MONGODB_URI'));
  const UserModel = mongoose.model(User.name, UserSchema);
  const GroupModel = mongoose.model(Groups.name, GroupsSchema);
  const password = await bcrypt.hash(process.env.DEMO_PASSWORD || 'DemoPassword123!', 12);
  const teacher = await UserModel.findOneAndUpdate(
    { registrationNumber: 'TEA000001' },
    { $setOnInsert: { id: uuidv4(), firstName: 'Docente', lastNameFather: 'Prueba', lastNameMother: 'Demo', password, phone: '525500000001', email: 'teacher.demo@example.test', birthDate: new Date('1990-01-01'), state: 'active', termsAccepted: true, userType: UserType.TEACHER } },
    { new: true, upsert: true },
  );
  const student = await UserModel.findOneAndUpdate(
    { registrationNumber: 'STU000001' },
    { $setOnInsert: { id: uuidv4(), firstName: 'Alumno', lastNameFather: 'Prueba', lastNameMother: 'Demo', password, phone: '525500000002', email: 'student.demo@example.test', birthDate: new Date('2000-01-01'), state: 'active', termsAccepted: true, userType: UserType.STUDENT } },
    { new: true, upsert: true },
  );
  await GroupModel.findOneAndUpdate(
    { nameGroup: 'Grupo de prueba' },
    { $setOnInsert: { id: uuidv4(), nameGroup: 'Grupo de prueba', course: 'Inglés', description: 'Grupo de prueba', level: 'Basic', schedule: '8:00 AM - 9:00 AM', state: 'active', users: [teacher.id, student.id], lessons: [], exams: [], games: [] } },
    { new: true, upsert: true },
  );
  console.log('Datos demo listos: TEA000001 y STU000001. Contraseña: DemoPassword123!');
}

seed().catch((error: Error) => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
