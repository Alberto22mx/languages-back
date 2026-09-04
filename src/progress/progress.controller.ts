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
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { ProgressService } from './progress.service';
import { CreateProgressDto, GradeExamProgressDto, RequestExamAccessDto } from './dto/progress.dto';
import { Progress } from './schemas/progress.schema';
import { ExamAccessRequestStatus } from './schemas/exam-access-request.schema';
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

  @Get('exam-access/:examId')
  @Roles(UserRole.STUDENT)
  getExamAccess(@Param('examId') examId: string, @Req() request: AuthenticatedRequest) {
    return this.progressService.getExamAccess(examId, request.user.userId);
  }

  @Post('exam-access/:examId/request')
  @Roles(UserRole.STUDENT)
  requestExamAccess(
    @Param('examId') examId: string,
    @Body() dto: RequestExamAccessDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.progressService.requestExamAccess(examId, request.user.userId, dto.reason);
  }

  @Get('exam-access-requests')
  @Roles(UserRole.TEACHER)
  getExamAccessRequests(@Req() request: AuthenticatedRequest): Promise<any[]> {
    return this.progressService.getExamAccessRequests(request.user.userId);
  }

  @Put('exam-access-requests/:id/:decision')
  @Roles(UserRole.TEACHER)
  reviewExamAccessRequest(
    @Param('id') id: string,
    @Param('decision') decision: string,
    @Req() request: AuthenticatedRequest,
  ) {
    if (decision !== ExamAccessRequestStatus.APPROVED && decision !== ExamAccessRequestStatus.REJECTED) {
      throw new NotFoundException('Decisión no válida');
    }
    return this.progressService.reviewExamAccessRequest(id, decision, request.user.userId);
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
