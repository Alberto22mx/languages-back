import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { CreateProgressDto } from './dto/progress.dto';
import { ProgressService } from './progress.service';
import { Progress, ProgressType } from './schemas/progress.schema';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post()
  create(@Body() createProgressDto: CreateProgressDto) {
    return this.progressService.create(createProgressDto);
  }

  @Get('user/:userId/type/:type')
  findByUserAndType(
    @Param('userId') userId: string,
    @Param('type') type: string,
  ) {
    return this.progressService.findByUserAndType(userId, type as ProgressType);
  }

  @Get('user/:userId/stats')
  getProgressStats(@Param('userId') userId: string) {
    return this.progressService.getProgressStats(userId);
  }

  @Put('user/:userId/reference/:referenceId')
  update(
    @Param('userId') userId: string,
    @Param('referenceId') referenceId: string,
    @Body() updateData: Partial<Progress>,
  ) {
    return this.progressService.updateProgress(userId, referenceId, updateData);
  }
}
