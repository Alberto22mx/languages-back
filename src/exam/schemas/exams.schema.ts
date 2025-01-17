import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IsNotEmpty, IsString } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';

export type ExamsDocument = Exams & Document;

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
export class Exams extends Document {
  @Prop({ default: uuidv4, immutable: true })
  id: string;

  @IsNotEmpty({ message: 'El título del examen es requerido' })
  @IsString()
  @Prop({ required: true, trim: true })
  title: string;

  @IsNotEmpty({ message: 'Las instrucciones son requeridas' })
  @IsString()
  @Prop({ required: true, trim: true })
  instructions: string;

  @Prop({ default: false })
  active: boolean;

  @Prop()
  image?: string;
}

export const ExamsSchema = SchemaFactory.createForClass(Exams);
