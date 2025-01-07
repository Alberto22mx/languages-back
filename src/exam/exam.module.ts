import { Module } from '@nestjs/common';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Exams, ExamsSchema } from './schemas/exams.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Exams.name, schema: ExamsSchema }]),
  ],
  controllers: [ExamController],
  providers: [ExamService],
})
export class ExamModule {}
