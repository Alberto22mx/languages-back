import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ProgressDocument = Progress & Document;

export enum ProgressType {
  LESSON = 'lesson',
  GAME = 'game',
  EXAM = 'exam',
}

@Schema({ timestamps: true })
export class Progress extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({
    type: String,
    required: true,
    enum: ProgressType,
  })
  type: ProgressType;

  @Prop({ type: [{ type: String, ref: 'Lesson' }] })
  referenceId: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  data: any;
}

export const ProgressSchema = SchemaFactory.createForClass(Progress);