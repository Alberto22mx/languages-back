import { IsArray, IsString } from 'class-validator';

export class FindLessonsDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
