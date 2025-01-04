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

export type UserDocument = User & Document;

enum UserType {
    ADMIN = 'admin',
    USER = 'user',
    TEACHER = 'teacher',
}

@Schema({
    timestamps: true,
    strict: true,
    toJSON: {
        virtuals: true,
        transform: function(doc, ret) {
            delete ret._id;
            delete ret.__v;
            delete ret.password; // No enviar password en respuestas
            return ret;
        }
    }
})
export class User {
    @IsNotEmpty({ message: 'El nombre es requerido' })
    @IsString()
    @Prop({ required: true, trim: true })
    first_name: string;

    @IsNotEmpty({ message: 'El apellido paterno es requerido' })
    @IsString()
    @Prop({ required: true, trim: true })
    last_name_father: string;

    @IsNotEmpty({ message: 'El apellido materno es requerido' })
    @IsString()
    @Prop({ required: true, trim: true })
    last_name_mother: string;

    @IsNotEmpty()
    @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'La contraseña debe contener mayúsculas, minúsculas y números'
    })
    @Prop({ required: true })
    password: string;

    @IsNotEmpty()
    @Prop({ required: true, unique: true })
    registration_number: string;

    @IsNotEmpty()
    @Matches(/^\+?[1-9]\d{1,14}$/, {
        message: 'Número de teléfono inválido'
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
    birth_date: Date;

    @IsNotEmpty()
    @IsEnum(['active', 'inactive'], { message: 'Estado inválido' })
    @Prop({ required: true, enum: ['active', 'inactive'], default: 'active' })
    state: string;

    @IsNotEmpty()
    @IsEnum(['yes', 'no'], { message: 'Debe aceptar los términos' })
    @Prop({ required: true })
    terms_accepted: string;

    @IsNotEmpty()
    @IsEnum(UserType, { message: 'Tipo de usuario inválido' })
    @Prop({ required: true, enum: UserType })
    user_type: string;

    @Prop()
    image?: string;

    @Prop({ default: Date.now })
    creation_date: Date;

    // Puedes agregar validaciones personalizadas
    @Prop({
        validate: {
            validator: function(v) {
                // Ejemplo de validación personalizada
                return v.length > 0;
            },
            message: props => `${props.path} no puede estar vacío`
        }
    })
    custom_field: string;
}

export const UserSchema = SchemaFactory.createForClass(User);