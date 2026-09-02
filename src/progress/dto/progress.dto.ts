import { ProgressType } from '../schemas/progress.schema';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

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
