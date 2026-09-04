import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Progress, ProgressDocument } from './schemas/progress.schema';
import { CreateProgressDto } from './dto/progress.dto';
import { Groups, GroupsDocument } from '../groups/schemas/groups.schema';
import { User, UserDocument, UserType } from '../users/schemas/user.schema';
import { ProgressType } from './schemas/progress.schema';

@Injectable()
export class ProgressService {
  constructor(
    @InjectModel(Progress.name) private progressModel: Model<ProgressDocument>,
    @InjectModel(Groups.name) private groupModel: Model<GroupsDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // Crear un nuevo progreso
  async create(createProgressDto: CreateProgressDto): Promise<Progress> {
    if (createProgressDto.type === ProgressType.EXAM) {
      const group = await this.groupModel.exists({
        users: createProgressDto.userId,
        exams: createProgressDto.referenceId,
        state: 'active',
      });
      if (!group) {
        throw new ForbiddenException('El examen no está asignado a un grupo activo del alumno');
      }
    }
    const createdProgress = new this.progressModel(createProgressDto);
    return createdProgress.save();
  }

  async getExamResults(groupId: string, examId: string, teacherId?: string) {
    const group = await this.groupModel.findOne({
      id: groupId,
      exams: examId,
      ...(teacherId ? { users: teacherId } : {}),
    }).exec();
    if (!group) {
      throw new ForbiddenException('No tienes acceso a las calificaciones de este grupo');
    }

    const students = await this.userModel.find({
      id: { $in: group.users },
      userType: UserType.STUDENT,
    }).select('id firstName lastNameFather lastNameMother registrationNumber email').exec();
    const submissions = await this.progressModel.find({
      type: ProgressType.EXAM,
      referenceId: examId,
      userId: { $in: students.map((student) => student.id) },
    }).sort({ createdAt: -1 }).exec();

    const latestByStudent = new Map<string, Progress>();
    for (const submission of submissions) {
      if (!latestByStudent.has(submission.userId)) {
        latestByStudent.set(submission.userId, submission);
      }
    }

    return students.map((student) => {
      const submission = latestByStudent.get(student.id);
      return {
        student,
        submission: submission ?? null,
      };
    });
  }

  async getStudentExamStatus(examId: string, studentId: string) {
    return this.progressModel
      .findOne({ type: ProgressType.EXAM, referenceId: examId, userId: studentId })
      .sort({ createdAt: -1 })
      .select('score feedback gradedAt createdAt')
      .exec();
  }

  async gradeExam(id: string, score: number, feedback: string | undefined, graderId: string, teacherId?: string): Promise<Progress> {
    const progress = await this.progressModel.findById(id).exec();
    if (!progress || progress.type !== ProgressType.EXAM) {
      throw new NotFoundException(`Exam submission with ID "${id}" not found`);
    }

    if (teacherId) {
      const group = await this.groupModel.exists({
        users: { $all: [teacherId, progress.userId] },
        exams: progress.referenceId,
      });
      if (!group) {
        throw new ForbiddenException('No puedes calificar esta entrega');
      }
    }

    progress.score = score;
    progress.feedback = feedback;
    progress.gradedBy = graderId;
    progress.gradedAt = new Date();
    return progress.save();
  }

  // Obtener todos los progresos
  async findAll(): Promise<Progress[]> {
    return this.progressModel.find().exec();
  }

  // Obtener un progreso por ID
  async findOne(id: string, ownerId?: string): Promise<Progress> {
    const progress = await this.progressModel
      .findOne({ _id: id, ...(ownerId ? { userId: ownerId } : {}) })
      .exec();
    if (!progress) {
      throw new NotFoundException(`Progress with ID "${id}" not found`);
    }
    return progress;
  }

  // Actualizar un progreso
  async update(
    id: string,
    updateProgressDto: CreateProgressDto,
    ownerId?: string,
  ): Promise<Progress> {
    const updatedProgress = await this.progressModel
      .findOneAndUpdate(
        { _id: id, ...(ownerId ? { userId: ownerId } : {}) },
        updateProgressDto,
        { new: true, runValidators: true },
      )
      .exec();
    if (!updatedProgress) {
      throw new NotFoundException(`Progress with ID "${id}" not found`);
    }
    return updatedProgress;
  }

  // Eliminar un progreso
  async remove(id: string): Promise<void> {
    const result = await this.progressModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Progress with ID "${id}" not found`);
    }
  }
}
