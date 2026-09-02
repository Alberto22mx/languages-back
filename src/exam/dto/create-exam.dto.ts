import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateExamDto {
  @IsOptional()
  @IsString()
  id: string;
  @IsString()
  @MaxLength(200)
  title: string;
  @IsString()
  instructions: string;
  @IsBoolean()
  active: boolean;
  @IsOptional()
  @IsString()
  image: string;
  @IsString()
  questions: string;
}
