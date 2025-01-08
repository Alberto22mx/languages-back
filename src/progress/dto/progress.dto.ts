import { IsEnum, IsMongoId, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProgressType } from '../schemas/progress.schema';
import {
  LessonProgress,
  GameProgress,
  ExamProgress,
} from '../interface/progress.interface';

export class CreateProgressDto {
  @IsNotEmpty()
  @IsMongoId()
  userId: string;

  @IsEnum(ProgressType)
  type: ProgressType;

  @IsNotEmpty()
  @IsMongoId()
  referenceId: string;

  @ValidateNested()
  @Type(() => Object)
  data: LessonProgress | GameProgress | ExamProgress;
}
