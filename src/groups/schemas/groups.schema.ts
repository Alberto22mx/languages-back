import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';
import { LevelGroup } from '../enums/level-group.enum';
import { ScheduleGroup } from '../enums/schedule-group.enum';

export type GroupsDocument = Groups & Document;

@Schema({
  timestamps: true,
  strict: true,
  toJSON: {
    virtuals: true,
    transform: function (_doc, ret) {
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Groups extends Document {
  @Prop({ default: uuidv4, immutable: true, type: String })
  id: string;

  @IsNotEmpty({ message: 'El nombre del grupo es requerida' })
  @IsString()
  @Prop({ required: true, trim: true })
  nameGroup: string;

  @IsNotEmpty({ message: 'El curso del grupo es requerido' })
  @IsString()
  @Prop({ required: true, trim: true })
  course: string;

  @IsNotEmpty({ message: 'La descripción del grupo es requerida' })
  @IsString()
  @Prop({ required: true, trim: true })
  description: string;

  @IsNotEmpty({ message: 'El nivel del grupo es requerido' })
  @IsString()
  @Prop({ required: true, trim: true, enum: LevelGroup })
  level: string;

  @IsNotEmpty({ message: 'El horario del grupo es requerido' })
  @IsString()
  @Prop({ required: true, trim: true, enum: ScheduleGroup })
  schedule: string;

  @IsNotEmpty()
  @IsEnum(['active', 'inactive'], { message: 'Estado inválido' })
  @Prop({ required: true, enum: ['active', 'inactive'], default: 'active' })
  state: string;

  @Prop()
  image?: string;

  @Prop({ type: [{ type: String, ref: 'Lessons' }], default: [] }) // Especifica que es String
  lessons: string[];

  @Prop({ type: [{ type: String, ref: 'Exams' }], default: [] }) // Especifica que es String
  exams: string[];

  @Prop({ type: [{ type: String, ref: 'Games' }], default: [] })
  games: string[];

  @Prop({ type: [{ type: String, ref: 'User' }], default: [] })
  users: string[];
}

export const GroupsSchema = SchemaFactory.createForClass(Groups);
