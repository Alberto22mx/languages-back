import { PartialType } from '@nestjs/mapped-types';
import { CreateGamesDto } from './create-games.dto';

export class UpdateGameDto extends PartialType(CreateGamesDto) {}
