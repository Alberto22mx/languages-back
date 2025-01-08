import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ProgressDocument = Progress & Document;

export enum ProgressType {
  LESSON = 'lesson',
  GAME = 'game',
  EXAM = 'exam',
}

@Schema({ timestamps: true })
export class Progress {
  @Prop({ required: true })
  userId: string;

  @Prop({
    type: String,
    required: true,
    enum: ProgressType,
  })
  type: ProgressType;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  referenceId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  data: any;

  @Prop({ default: false })
  completed: boolean;

  @Prop({ default: 0 })
  score: number;
}

export const ProgressSchema = SchemaFactory.createForClass(Progress);