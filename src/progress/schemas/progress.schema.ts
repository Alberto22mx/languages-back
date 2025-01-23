import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type ProgressDocument = Progress & Document;

export enum ProgressType {
  LESSON = 'lesson',
  GAME = 'game',
  EXAM = 'exam',
}

@Schema({ timestamps: true })
export class Progress {
  @Prop({ default: uuidv4, immutable: true, type: String })
  id: string;

  @Prop({ required: true })
  userId: string;

  @Prop({
    type: String,
    required: true,
    enum: ProgressType,
  })
  type: ProgressType;

  @Prop({ type: [{ type: String }] })
  referenceId: string;

  @Prop({ type: [Object], required: true, default: [] })
  answers: any[];
}

export const ProgressSchema = SchemaFactory.createForClass(Progress);
