import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { LevelGroup } from '../../groups/enums/level-group.enum';
import { CourseTemplateStatus } from '../course-template-status.enum';

export type CourseTemplateDocument = CourseTemplate & Document;

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
export class CourseTemplate {
  @Prop({ default: uuidv4, immutable: true, type: String })
  id: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  name: string;

  @Prop({ required: true, trim: true })
  course: string;

  @Prop({ required: true, enum: LevelGroup })
  level: LevelGroup;

  @Prop({ required: true, min: 1, default: 1 })
  version: number;

  @Prop({
    required: true,
    enum: CourseTemplateStatus,
    default: CourseTemplateStatus.ACTIVE,
  })
  status: CourseTemplateStatus;

  @Prop({ type: String, ref: 'CourseTemplate' })
  previousTemplateId?: string;

  @Prop({ type: [{ type: String, ref: 'Lessons' }], default: [] })
  lessons: string[];

  @Prop({ type: [{ type: String, ref: 'Exams' }], default: [] })
  exams: string[];
}

export const CourseTemplateSchema =
  SchemaFactory.createForClass(CourseTemplate);
CourseTemplateSchema.index(
  { course: 1, level: 1, version: 1 },
  { unique: true },
);
