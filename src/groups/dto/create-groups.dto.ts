export class CreateGroupsDto {
  id: string;
  nameGroup: string;
  level: string;
  schedule: string;
  state: string;
  image: string;
  exams: string[];
  lessons: string[];
  games: string[];
  users: string[];
}
