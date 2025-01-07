import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { IsNotEmpty, IsString } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';
import { Games } from 'src/games/schemas/games.schema';
import { Lessons } from 'src/lessons/schemas/lessons.schema';
import { Exams } from 'src/exam/schemas/exams.schema';

export type GroupsDocument = Groups & Document;

@Schema({
  timestamps: true,
  strict: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Groups {
  @Prop({ default: uuidv4, immutable: true })
  id: string;

  @IsNotEmpty({ message: 'El nombre del grupo es requerido' })
  @IsString()
  @Prop({ required: true, trim: true })
  name: string;

  @IsNotEmpty({ message: 'La descripción del grupo es requerida' })
  @IsString()
  @Prop({ required: true, trim: true })
  description: string;

  @IsNotEmpty({ message: 'El nivel del grupo es requerido' })
  @IsString()
  @Prop({ required: true, trim: true })
  level: string;

  @IsNotEmpty({ message: 'El horario del grupo es requerido' })
  @IsString()
  @Prop({ required: true, trim: true })
  schedule: string;

  @Prop({ default: false })
  active: boolean;

  @Prop()
  image?: string;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }] })
  lessons: Lessons[];

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }] })
  games: Games[];

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exam' }] })
  exams: Exams[];
}

export const GroupsSchema = SchemaFactory.createForClass(Groups);
