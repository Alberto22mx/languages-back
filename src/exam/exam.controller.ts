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
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ExamService } from './exam.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { Exams } from './schemas/exams.schema';
import { UpdateExamDto } from './dto/update-exam.dto';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../auth/user-role.enum';

type AuthenticatedRequest = Request & {
  user: { userId: string; userType: UserRole };
};

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
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @UsePipes(new ValidationPipe())
  async create(@Body() createUserDto: CreateExamDto) {
    return this.examService.create(createUserDto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async updateExam(
    @Param('id') id: string,
    @Body() updateExamDto: UpdateExamDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<Exams> {
    const teacherId = request.user.userType === UserRole.TEACHER ? request.user.userId : undefined;
    return this.examService.updateExam(id, updateExamDto, teacherId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.examService.deleteUserById(id);
  }
}
