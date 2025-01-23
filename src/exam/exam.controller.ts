import {
  Controller,
  Get,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
  Body,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ExamService } from './exam.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { Exams } from './schemas/exams.schema';
import { UpdateExamDto } from './dto/update-exam.dto';

@Controller('exam')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Get()
  findAll(): Promise<Exams[]> {
    return this.examService.findAll();
  }

  @Post('find-many')
  findMany(@Body('ids') ids: string[]): Promise<Exams[]> {
    return this.examService.findMany(ids);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Exams> {
    return this.examService.findOne(id);
  }

  @Post()
  @UsePipes(new ValidationPipe())
  async create(@Body() createUserDto: CreateExamDto) {
    return this.examService.create(createUserDto);
  }

  @Patch(':id')
  async updateExam(
    @Param('id') id: string,
    @Body() updateExamDto: UpdateExamDto,
  ): Promise<Exams> {
    return this.examService.updateExam(id, updateExamDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.examService.deleteUserById(id);
  }
}
