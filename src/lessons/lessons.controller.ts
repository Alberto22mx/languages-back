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
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lessons.dto';
import { UpdateLessonDto } from './dto/update-lessons.dto';
import { Lessons } from './schemas/lessons.schema';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../auth/user-role.enum';

@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get()
  findAll(): Promise<Lessons[]> {
    return this.lessonsService.findAll();
  }

  @Post('find-many')
  findMany(@Body('ids') ids: string[]): Promise<Lessons[]> {
    return this.lessonsService.findMany(ids);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Lessons> {
    return this.lessonsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @UsePipes(new ValidationPipe())
  async create(@Body() createUserDto: CreateLessonDto) {
    return this.lessonsService.create(createUserDto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateLessonDto,
  ): Promise<Lessons> {
    return this.lessonsService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.lessonsService.deleteUserById(id);
  }
}
