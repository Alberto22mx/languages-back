import { Module } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { LessonsController } from './lessons.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Lessons, LessonsSchema } from './schemas/lessons.schema';
import { Groups, GroupsSchema } from '../groups/schemas/groups.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Lessons.name, schema: LessonsSchema },
      { name: Groups.name, schema: GroupsSchema },
    ]),
  ],
  providers: [LessonsService],
  controllers: [LessonsController],
})
export class LessonsModule {}
