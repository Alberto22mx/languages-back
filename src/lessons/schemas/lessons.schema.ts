import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { IsNotEmpty, IsString } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';

export type LessonsDocument = Lessons & Document;

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
export class Lessons extends Document {
  @Prop({ default: uuidv4, immutable: true, type: String })
  id: string;

  @IsNotEmpty({ message: 'El título es requerido' })
  @IsString()
  @Prop({ required: true, trim: true })
  title: string;

  @IsNotEmpty({ message: 'Las instrucciones son requeridas' })
  @IsString()
  @Prop({ required: true, trim: true })
  instructions: string;

  @Prop({ default: '' })
  content?: string;

  @Prop({ default: false })
  active: boolean;

  @Prop()
  image?: string;
}

export const LessonsSchema = SchemaFactory.createForClass(Lessons);
