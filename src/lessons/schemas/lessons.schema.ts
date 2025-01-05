import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IsNotEmpty, IsString } from 'class-validator';

export type LessonsDocument = Lessons & Document;

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
export class Lessons {
  @IsNotEmpty({ message: 'El ID del usuario es requerido' })
  @IsString()
  @Prop({ required: true })
  user_id: string;

  @IsNotEmpty({ message: 'El título es requerido' })
  @IsString()
  @Prop({ required: true, trim: true })
  title: string;

  @IsNotEmpty({ message: 'Las instrucciones son requeridas' })
  @IsString()
  @Prop({ required: true, trim: true })
  instructions: string;

  @IsNotEmpty({ message: 'El progreso es requerido' })
  @IsString()
  @Prop({ required: true, trim: true })
  progress: string;
}

export const LessonsSchema = SchemaFactory.createForClass(Lessons);
