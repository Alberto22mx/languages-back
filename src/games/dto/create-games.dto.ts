import { GameType } from '../schemas/games.schema';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateGamesDto {
  @IsOptional()
  @IsString()
  id: string;
  @IsString()
  @MaxLength(200)
  title: string;
  @IsString()
  instructions: string;
  @IsString()
  active: string;
  @IsOptional()
  @IsString()
  image: string;
  @IsString()
  url: string;
  @IsOptional()
  @IsArray()
  data?: any[];
  @IsEnum(GameType)
  type: GameType;
}
