import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Groups, GroupsSchema } from './schemas/groups.schema';
import { Lessons, LessonsSchema } from 'src/lessons/schemas/lessons.schema';
import { Games, GamesSchema } from 'src/games/schemas/games.schema';
import { Exams, ExamsSchema } from 'src/exam/schemas/exams.schema';
import { User, UserSchema } from 'src/users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Groups.name, schema: GroupsSchema },
      { name: Lessons.name, schema: LessonsSchema },
      { name: Games.name, schema: GamesSchema },
      { name: Exams.name, schema: ExamsSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [GroupsController],
  providers: [GroupsService],
})
export class GroupsModule {}
