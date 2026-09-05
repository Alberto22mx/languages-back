import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Exams, ExamsSchema } from '../exam/schemas/exams.schema';
import { Lessons, LessonsSchema } from '../lessons/schemas/lessons.schema';
import { Groups, GroupsSchema } from '../groups/schemas/groups.schema';
import { CourseTemplatesController } from './course-templates.controller';
import { CourseTemplatesService } from './course-templates.service';
import {
  CourseTemplate,
  CourseTemplateSchema,
} from './schemas/course-template.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CourseTemplate.name, schema: CourseTemplateSchema },
      { name: Lessons.name, schema: LessonsSchema },
      { name: Exams.name, schema: ExamsSchema },
      { name: Groups.name, schema: GroupsSchema },
    ]),
  ],
  controllers: [CourseTemplatesController],
  providers: [CourseTemplatesService],
  exports: [CourseTemplatesService],
})
export class CourseTemplatesModule {}
