import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProgressService } from './progress.service';
import { CreateProgressDto } from './dto/progress.dto';
import { Progress } from './schemas/progress.schema';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createProgressDto: CreateProgressDto): Promise<Progress> {
    return this.progressService.create(createProgressDto);
  }

  @Get()
  findAll(): Promise<Progress[]> {
    return this.progressService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Progress> {
    return this.progressService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateProgressDto: CreateProgressDto,
  ): Promise<Progress> {
    return this.progressService.update(id, updateProgressDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.progressService.remove(id);
  }
}
