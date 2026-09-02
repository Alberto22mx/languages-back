import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsDate,
  IsEnum,
  Matches,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';

export type UserDocument = User & Document;

export enum UserType {
  ADMIN = 'admin',
  STUDENT = 'student',
  TEACHER = 'teacher',
}

@Schema({
  timestamps: true,
  strict: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      delete ret._id;
      delete ret.__v;
      delete (ret as Record<string, unknown>).password;
      return ret;
    },
  },
})
export class User {
  [x: string]: any;
  @Prop({ default: uuidv4, immutable: true, type: String })
  id: string;

  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString()
  @Prop({ required: true, trim: true })
  firstName: string;

  @IsNotEmpty({ message: 'El apellido paterno es requerido' })
  @IsString()
  @Prop({ required: true, trim: true })
  lastNameFather: string;

  @IsNotEmpty({ message: 'El apellido materno es requerido' })
  @IsString()
  @Prop({ required: true, trim: true })
  lastNameMother: string;

  @IsNotEmpty()
  @MinLength(10, { message: 'La contraseña debe tener al menos 10 caracteres' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'La contraseña debe contener mayúsculas, minúsculas y números',
  })
  @Prop({ required: true, select: false })
  password: string;

  @IsNotEmpty()
  @Prop({ required: true, unique: true, trim: true })
  registrationNumber: string;

  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Número de teléfono inválido',
  })
  @Prop({ required: true })
  phone: string;

  @IsNotEmpty()
  @IsEmail({}, { message: 'Email inválido' })
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @IsNotEmpty()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @Prop({ required: true })
  birthDate: Date;

  @IsNotEmpty()
  @IsEnum(['active', 'inactive'], { message: 'Estado inválido' })
  @Prop({ required: true, enum: ['active', 'inactive'], default: 'inactive' })
  state: string;

  @Prop()
  termsAccepted?: boolean;

  @IsNotEmpty()
  @IsEnum(UserType, { message: 'Tipo de usuario inválido' })
  @Prop({ required: true, enum: UserType })
  userType: string;

  @Prop()
  image?: string;

  @Prop()
  deletedAt: Date;

  @Prop({ select: false })
  refreshTokenHash?: string;

  @Prop({ select: false })
  setupTokenHash?: string;

  @Prop({ select: false })
  setupTokenExpiresAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
