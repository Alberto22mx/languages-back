import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export enum EnrollmentStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  WITHDRAWN = 'withdrawn',
}

export type GroupEnrollmentDocument = GroupEnrollment & Document;

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
export class GroupEnrollment {
  @Prop({ default: uuidv4, immutable: true, type: String })
  id: string;

  @Prop({ required: true, type: String, ref: 'User' })
  studentId: string;

  @Prop({ required: true, type: String, ref: 'Groups' })
  groupId: string;

  @Prop({
    required: true,
    enum: EnrollmentStatus,
    default: EnrollmentStatus.IN_PROGRESS,
  })
  status: EnrollmentStatus;

  @Prop()
  completedAt?: Date;

  @Prop({ type: String, ref: 'User' })
  completedBy?: string;

  @Prop()
  withdrawnAt?: Date;

  @Prop({ type: String, ref: 'User' })
  withdrawnBy?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const GroupEnrollmentSchema =
  SchemaFactory.createForClass(GroupEnrollment);
GroupEnrollmentSchema.index(
  { studentId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: EnrollmentStatus.IN_PROGRESS },
  },
);
