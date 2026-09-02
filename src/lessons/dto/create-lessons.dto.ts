import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateLessonDto {
  @IsOptional()
  @IsString()
  id: string;
  @IsString()
  @MaxLength(200)
  title: string;
  @IsString()
  instructions: string;
  @IsOptional()
  @IsString()
  content?: string;
  @IsString()
  active: string;
  @IsOptional()
  @IsString()
  image: string;
}
