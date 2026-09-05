import { Module } from '@nestjs/common';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Progress, ProgressSchema } from './schemas/progress.schema';
import { Groups, GroupsSchema } from 'src/groups/schemas/groups.schema';
import { User, UserSchema } from 'src/users/schemas/user.schema';
import { Exams, ExamsSchema } from 'src/exam/schemas/exams.schema';
import {
  ExamAccessRequest,
  ExamAccessRequestSchema,
} from './schemas/exam-access-request.schema';
import {
  GroupEnrollment,
  GroupEnrollmentSchema,
} from 'src/groups/schemas/group-enrollment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Progress.name, schema: ProgressSchema },
      { name: Groups.name, schema: GroupsSchema },
      { name: User.name, schema: UserSchema },
      { name: Exams.name, schema: ExamsSchema },
      { name: ExamAccessRequest.name, schema: ExamAccessRequestSchema },
      { name: GroupEnrollment.name, schema: GroupEnrollmentSchema },
    ]),
  ],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
