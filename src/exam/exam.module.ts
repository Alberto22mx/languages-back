import { Module } from '@nestjs/common';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Exams, ExamsSchema } from './schemas/exams.schema';
import { Groups, GroupsSchema } from 'src/groups/schemas/groups.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Exams.name, schema: ExamsSchema },
      { name: Groups.name, schema: GroupsSchema },
    ]),
  ],
  controllers: [ExamController],
  providers: [ExamService],
})
export class ExamModule {}
