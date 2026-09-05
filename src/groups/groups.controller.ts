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
import { GroupsService } from './groups.service';
import { Groups } from './schemas/groups.schema';
import { CreateGroupsDto } from './dto/create-groups.dto';
import { UpdateGroupsDto } from './dto/update-groups.dto';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../auth/user-role.enum';
import { Req } from '@nestjs/common';
import { Request } from 'express';

type AuthenticatedRequest = Request & {
  user: { userId: string; userType: UserRole };
};

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  findAll(): Promise<Groups[]> {
    return this.groupsService.findAll();
  }

  @Get('group-relation/:userId')
  async getGroup(@Param('userId') userId: string): Promise<Groups[]> {
    return this.groupsService.getGroupWithRelations(userId);
  }

  @Get('teacher/students')
  @Roles(UserRole.TEACHER)
  getStudentsForTeacher(@Req() request: AuthenticatedRequest) {
    return this.groupsService.getStudentsForTeacher(request.user.userId);
  }

  @Get(':id/students')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  getActiveStudentIds(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<string[]> {
    const teacherId =
      request.user.userType === UserRole.TEACHER
        ? request.user.userId
        : undefined;
    return this.groupsService.getActiveStudentIds(id, teacherId);
  }

  @Post(':id/students/:studentId/complete')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  completeStudent(
    @Param('id') groupId: string,
    @Param('studentId') studentId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const teacherId =
      request.user.userType === UserRole.TEACHER
        ? request.user.userId
        : undefined;
    return this.groupsService.completeStudent(groupId, studentId, teacherId);
  }

  @Post(':id/students/:studentId/withdraw')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  withdrawStudent(
    @Param('id') groupId: string,
    @Param('studentId') studentId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const teacherId =
      request.user.userType === UserRole.TEACHER
        ? request.user.userId
        : undefined;
    return this.groupsService.withdrawStudent(groupId, studentId, teacherId);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Groups> {
    return this.groupsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @UsePipes(new ValidationPipe())
  async create(@Body() createUserDto: CreateGroupsDto) {
    return this.groupsService.create(createUserDto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateGroup(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateGroupsDto,
  ): Promise<Groups> {
    return this.groupsService.updateGroup(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.groupsService.deleteUserById(id);
  }
}
