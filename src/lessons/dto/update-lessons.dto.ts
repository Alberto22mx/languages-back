import { PartialType } from '@nestjs/mapped-types';
import { CreateLessonDto } from './create-lessons.dto';

export class UpdateLessonDto extends PartialType(CreateLessonDto) {}
