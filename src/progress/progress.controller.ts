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
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ProgressService } from './progress.service';
import { CreateProgressDto, GradeExamProgressDto } from './dto/progress.dto';
import { Progress } from './schemas/progress.schema';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../auth/user-role.enum';

type AuthenticatedRequest = Request & {
  user: { userId: string; userType: UserRole };
};

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}
  @Post()
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createProgressDto: CreateProgressDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<Progress> {
    return this.progressService.create({
      ...createProgressDto,
      userId: request.user.userId,
    });
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  findAll(): Promise<Progress[]> {
    return this.progressService.findAll();
  }

  @Get('exam-results/:groupId/:examId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  getExamResults(
    @Param('groupId') groupId: string,
    @Param('examId') examId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const teacherId = request.user.userType === UserRole.TEACHER ? request.user.userId : undefined;
    return this.progressService.getExamResults(groupId, examId, teacherId);
  }

  @Get('exam-status/:examId')
  @Roles(UserRole.STUDENT)
  getStudentExamStatus(
    @Param('examId') examId: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<Progress | null> {
    return this.progressService.getStudentExamStatus(examId, request.user.userId);
  }

  @Get('student-exam-results/:studentId')
  @Roles(UserRole.TEACHER)
  getStudentExamResults(
    @Param('studentId') studentId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.progressService.getStudentExamResults(studentId, request.user.userId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<Progress> {
    const owner =
      request.user.userType === UserRole.ADMIN
        ? undefined
        : request.user.userId;
    return this.progressService.findOne(id, owner);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateProgressDto: CreateProgressDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<Progress> {
    const owner =
      request.user.userType === UserRole.ADMIN
        ? undefined
        : request.user.userId;
    return this.progressService.update(
      id,
      { ...updateProgressDto, userId: owner ?? updateProgressDto.userId },
      owner,
    );
  }

  @Put(':id/grade')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  gradeExam(
    @Param('id') id: string,
    @Body() gradeDto: GradeExamProgressDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<Progress> {
    const teacherId = request.user.userType === UserRole.TEACHER ? request.user.userId : undefined;
    return this.progressService.gradeExam(
      id,
      gradeDto.answers,
      gradeDto.feedback,
      request.user.userId,
      teacherId,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.progressService.remove(id);
  }
}
