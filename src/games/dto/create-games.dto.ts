import { GameType } from "../schemas/games.schema";

export class CreateGamesDto {
  id: string;
  title: string;
  instructions: string;
  active: string;
  image: string;
  url: string;
  data?: any[];
  type: GameType;
}
