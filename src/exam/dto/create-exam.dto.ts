import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateExamDto {
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
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsArray()
  questions?: any[];

  @IsOptional()
  @IsDateString()
  availableUntil?: string;
}
