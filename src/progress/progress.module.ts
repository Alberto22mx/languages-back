import { Module } from '@nestjs/common';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Progress, ProgressSchema } from './schemas/progress.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Progress.name, schema: ProgressSchema },
    ]),
  ],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
