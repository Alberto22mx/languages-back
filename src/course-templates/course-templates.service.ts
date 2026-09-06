import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Exams, ExamsDocument } from '../exam/schemas/exams.schema';
import { Lessons, LessonsDocument } from '../lessons/schemas/lessons.schema';
import { Groups, GroupsDocument } from '../groups/schemas/groups.schema';
import { CreateCourseTemplateDto } from './dto/create-course-template.dto';
import { UpdateCourseTemplateDto } from './dto/update-course-template.dto';
import {
  CourseTemplate,
  CourseTemplateDocument,
} from './schemas/course-template.schema';

@Injectable()
export class CourseTemplatesService {
  constructor(
    @InjectModel(CourseTemplate.name)
    private readonly courseTemplateModel: Model<CourseTemplateDocument>,
    @InjectModel(Lessons.name)
    private readonly lessonModel: Model<LessonsDocument>,
    @InjectModel(Exams.name) private readonly examModel: Model<ExamsDocument>,
    @InjectModel(Groups.name)
    private readonly groupModel: Model<GroupsDocument>,
  ) {}

  async findAll(): Promise<CourseTemplate[]> {
    return this.courseTemplateModel
      .find()
      .sort({ course: 1, level: 1, version: -1 })
      .exec();
  }

  async findOne(id: string): Promise<CourseTemplate> {
    const template = await this.courseTemplateModel.findOne({ id }).exec();
    if (!template)
      throw new NotFoundException('Plantilla de curso no encontrada');
    return template;
  }

  async create(
    createCourseTemplateDto: CreateCourseTemplateDto,
  ): Promise<CourseTemplate> {
    const payload = {
      ...createCourseTemplateDto,
      lessons: createCourseTemplateDto.lessons ?? [],
      exams: createCourseTemplateDto.exams ?? [],
      version: createCourseTemplateDto.version ?? 1,
    };

    await this.validateContentReferences(payload.lessons, payload.exams);
    await this.ensureVersionIsAvailable(
      payload.course,
      payload.level,
      payload.version,
    );

    return new this.courseTemplateModel(payload).save();
  }

  async update(
    id: string,
    updateCourseTemplateDto: UpdateCourseTemplateDto,
  ): Promise<CourseTemplate> {
    const template = await this.findOne(id);
    const lessons = updateCourseTemplateDto.lessons ?? template.lessons;
    const exams = updateCourseTemplateDto.exams ?? template.exams;

    await this.validateContentReferences(lessons, exams);
    await this.ensureVersionIsAvailable(
      updateCourseTemplateDto.course ?? template.course,
      updateCourseTemplateDto.level ?? template.level,
      updateCourseTemplateDto.version ?? template.version,
      id,
    );

    const updatedTemplate = await this.courseTemplateModel
      .findOneAndUpdate({ id }, updateCourseTemplateDto, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!updatedTemplate)
      throw new NotFoundException('Plantilla de curso no encontrada');

    // Los grupos vinculados deben reflejar de inmediato el contenido editado.
    await this.groupModel
      .updateMany(
        { templateId: id },
        {
          lessons: updatedTemplate.lessons,
          exams: updatedTemplate.exams,
          templateVersion: updatedTemplate.version,
        },
      )
      .exec();

    return updatedTemplate;
  }

  async remove(id: string): Promise<void> {
    // Se conserva el contenido ya copiado en cada grupo, pero se elimina el vínculo.
    await this.groupModel
      .updateMany(
        { templateId: id },
        { $unset: { templateId: 1, templateVersion: 1 } },
      )
      .exec();

    const result = await this.courseTemplateModel.deleteOne({ id }).exec();
    if (result.deletedCount === 0)
      throw new NotFoundException('Plantilla de curso no encontrada');
  }

  private async validateContentReferences(
    lessonIds: string[],
    examIds: string[],
  ): Promise<void> {
    const [lessonCount, examCount] = await Promise.all([
      this.lessonModel.countDocuments({ id: { $in: lessonIds } }).exec(),
      this.examModel.countDocuments({ id: { $in: examIds } }).exec(),
    ]);

    if (lessonCount !== lessonIds.length || examCount !== examIds.length) {
      throw new BadRequestException(
        'La plantilla contiene lecciones o exámenes inexistentes',
      );
    }
  }

  private async ensureVersionIsAvailable(
    course: string,
    level: string,
    version: number,
    currentTemplateId?: string,
  ): Promise<void> {
    const existingTemplate = await this.courseTemplateModel.exists({
      course,
      level,
      version,
      ...(currentTemplateId ? { id: { $ne: currentTemplateId } } : {}),
    });

    if (existingTemplate) {
      throw new ConflictException(
        'Ya existe una plantilla para ese curso, nivel y versión',
      );
    }
  }
}
