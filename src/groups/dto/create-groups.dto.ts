import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { LevelGroup } from '../enums/level-group.enum';
import { ScheduleGroup } from '../enums/schedule-group.enum';

export class CreateGroupsDto {
  @IsOptional()
  @IsString()
  id: string;
  @IsString()
  @MaxLength(120)
  nameGroup: string;
  @IsEnum(LevelGroup)
  level: string;
  @IsEnum(ScheduleGroup)
  schedule: string;
  @IsEnum(['active', 'inactive'])
  state: string;
  @IsOptional()
  @IsString()
  image: string;
  @IsString()
  course: string;
  @IsString()
  description: string;
  @IsArray()
  @IsString({ each: true })
  exams: string[];
  @IsArray()
  @IsString({ each: true })
  lessons: string[];
  @IsArray()
  @IsString({ each: true })
  games: string[];
  @IsArray()
  @IsString({ each: true })
  users: string[];
}
