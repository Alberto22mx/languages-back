import { GameType } from "./schemas/games.schema";

export class Games {
  id: string;
  title: string;
  instructions: string;
  progress: string;
  image: string;
  data?: any[];
  type: GameType;
}
