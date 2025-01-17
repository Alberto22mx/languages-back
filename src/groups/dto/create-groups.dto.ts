import { Exams } from 'src/exam/schemas/exams.schema';
import { Games } from 'src/games/schemas/games.schema';
import { Lessons } from 'src/lessons/lessons.entity';
import { User } from 'src/users/schemas/user.schema';

export class CreateGroupsDto {
  id: string;
  nameGroup: string;
  level: string;
  schedule: string;
  state: string;
  image: string;
  exams: Exams[];
  lessons: Lessons[];
  games: Games[];
  users: User[];
}
