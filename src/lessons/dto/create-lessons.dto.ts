import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateLessonDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title: string;

  @IsNotEmpty()
  @IsString()
  instructions: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  image?: string;
}
