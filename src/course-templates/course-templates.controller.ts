import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../auth/user-role.enum';
import { CourseTemplatesService } from './course-templates.service';
import { CreateCourseTemplateDto } from './dto/create-course-template.dto';
import { UpdateCourseTemplateDto } from './dto/update-course-template.dto';
import { CourseTemplate } from './schemas/course-template.schema';

@Controller('course-templates')
@Roles(UserRole.ADMIN)
export class CourseTemplatesController {
  constructor(
    private readonly courseTemplatesService: CourseTemplatesService,
  ) {}

  @Get()
  findAll(): Promise<CourseTemplate[]> {
    return this.courseTemplatesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<CourseTemplate> {
    return this.courseTemplatesService.findOne(id);
  }

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  create(
    @Body() createCourseTemplateDto: CreateCourseTemplateDto,
  ): Promise<CourseTemplate> {
    return this.courseTemplatesService.create(createCourseTemplateDto);
  }

  @Post(':id/versions')
  createNextVersion(@Param('id') id: string): Promise<CourseTemplate> {
    return this.courseTemplatesService.createNextVersion(id);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  update(
    @Param('id') id: string,
    @Body() updateCourseTemplateDto: UpdateCourseTemplateDto,
  ): Promise<CourseTemplate> {
    return this.courseTemplatesService.update(id, updateCourseTemplateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.courseTemplatesService.remove(id);
  }
}
