import { ProgressType } from '../schemas/progress.schema';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateProgressDto {
  @IsOptional()
  @IsString()
  userId: string;
  @IsEnum(ProgressType)
  type: ProgressType;
  @IsString()
  referenceId: string;
  @IsArray()
  answers: any[];
}

export class GradeExamProgressDto {
  @IsArray()
  answers: any[];

  @IsOptional()
  @IsString()
  feedback?: string;
}
