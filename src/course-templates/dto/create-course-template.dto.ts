import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { LevelGroup } from '../../groups/enums/level-group.enum';
import { CourseTemplateStatus } from '../course-template-status.enum';

export class CreateCourseTemplateDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  name: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  course: string;

  @IsEnum(LevelGroup)
  level: LevelGroup;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  version?: number;

  @IsOptional()
  @IsEnum(CourseTemplateStatus)
  status?: CourseTemplateStatus;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  lessons?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  exams?: string[];
}
