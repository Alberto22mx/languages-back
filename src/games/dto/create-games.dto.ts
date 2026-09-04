import { GameType } from '../schemas/games.schema';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateGamesDto {
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
  @IsString()
  url?: string;

  @IsOptional()
  @IsArray()
  data?: any[];

  @IsOptional()
  @IsEnum(GameType)
  type?: GameType;
}
