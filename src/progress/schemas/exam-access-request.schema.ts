import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type ExamAccessRequestDocument = ExamAccessRequest & Document;

export enum ExamAccessRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true })
export class ExamAccessRequest {
  @Prop({ default: uuidv4, immutable: true, type: String })
  id: string;

  @Prop({ required: true, index: true })
  studentId: string;

  @Prop({ required: true, index: true })
  examId: string;

  @Prop({ type: String, enum: ExamAccessRequestStatus, default: ExamAccessRequestStatus.PENDING })
  status: ExamAccessRequestStatus;

  @Prop({ trim: true, maxlength: 500 })
  reason?: string;

  @Prop()
  reviewedBy?: string;

  @Prop()
  reviewedAt?: Date;

  @Prop()
  expiresAt?: Date;

  @Prop({ default: false })
  attemptUsed: boolean;
}

export const ExamAccessRequestSchema = SchemaFactory.createForClass(ExamAccessRequest);
