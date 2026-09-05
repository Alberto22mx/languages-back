import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Progress, ProgressDocument } from './schemas/progress.schema';
import { CreateProgressDto } from './dto/progress.dto';
import { Groups, GroupsDocument } from '../groups/schemas/groups.schema';
import { User, UserDocument, UserType } from '../users/schemas/user.schema';
import { ProgressType } from './schemas/progress.schema';
import { Exams, ExamsDocument } from '../exam/schemas/exams.schema';
import {
  ExamAccessRequest,
  ExamAccessRequestDocument,
  ExamAccessRequestStatus,
} from './schemas/exam-access-request.schema';
import {
  EnrollmentStatus,
  GroupEnrollment,
  GroupEnrollmentDocument,
} from '../groups/schemas/group-enrollment.schema';

@Injectable()
export class ProgressService {
  constructor(
    @InjectModel(Progress.name) private progressModel: Model<ProgressDocument>,
    @InjectModel(Groups.name) private groupModel: Model<GroupsDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Exams.name) private examModel: Model<ExamsDocument>,
    @InjectModel(ExamAccessRequest.name)
    private accessRequestModel: Model<ExamAccessRequestDocument>,
    @InjectModel(GroupEnrollment.name)
    private enrollmentModel: Model<GroupEnrollmentDocument>,
  ) {}

  // Crear un nuevo progreso
  async create(createProgressDto: CreateProgressDto): Promise<Progress> {
    if (createProgressDto.type === ProgressType.EXAM) {
      if (
        !(await this.studentHasActiveExam(
          createProgressDto.userId,
          String(createProgressDto.referenceId),
        ))
      ) {
        throw new ForbiddenException(
          'El examen no está asignado a un grupo activo del alumno',
        );
      }
      const exam = await this.examModel
        .findOne({ id: createProgressDto.referenceId })
        .exec();
      if (!exam) throw new NotFoundException('Examen no encontrado');
      if (exam.availableUntil && new Date() > exam.availableUntil) {
        throw new ForbiddenException(
          'La fecha límite para presentar este examen ya venció',
        );
      }
      const submissions = await this.progressModel.countDocuments({
        type: ProgressType.EXAM,
        referenceId: exam.id,
        userId: createProgressDto.userId,
      });
      const approvedRequest = await this.accessRequestModel
        .findOne({
          examId: exam.id,
          studentId: createProgressDto.userId,
          status: ExamAccessRequestStatus.APPROVED,
          attemptUsed: false,
          expiresAt: { $gt: new Date() },
        })
        .exec();
      if (submissions >= exam.maxAttempts + (approvedRequest ? 1 : 0)) {
        throw new ForbiddenException(
          'Ya utilizaste todos los intentos disponibles para este examen',
        );
      }
      const createdProgress = new this.progressModel(createProgressDto);
      const savedProgress = await createdProgress.save();
      if (approvedRequest) {
        approvedRequest.attemptUsed = true;
        await approvedRequest.save();
      }
      return savedProgress;
    }
    const createdProgress = new this.progressModel(createProgressDto);
    return createdProgress.save();
  }

  async getExamResults(groupId: string, examId: string, teacherId?: string) {
    const group = await this.groupModel
      .findOne({
        id: groupId,
        exams: examId,
        ...(teacherId ? { $or: [{ teacherId }, { users: teacherId }] } : {}),
      })
      .exec();
    if (!group) {
      throw new ForbiddenException(
        'No tienes acceso a las calificaciones de este grupo',
      );
    }

    const students = await this.userModel
      .find({
        id: { $in: await this.getActiveStudentIdsForGroup(group) },
        userType: UserType.STUDENT,
      })
      .select(
        'id firstName lastNameFather lastNameMother registrationNumber email',
      )
      .exec();
    const submissions = await this.progressModel
      .find({
        type: ProgressType.EXAM,
        referenceId: examId,
        userId: { $in: students.map((student) => student.id) },
      })
      .sort({ createdAt: -1 })
      .exec();

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
      .findOne({
        type: ProgressType.EXAM,
        referenceId: examId,
        userId: studentId,
      })
      .sort({ createdAt: -1 })
      .select('score feedback gradedAt createdAt')
      .exec();
  }

  async getExamAccess(examId: string, studentId: string) {
    const exam = await this.examModel
      .findOne({ id: examId })
      .select('id availableUntil maxAttempts')
      .exec();
    if (!exam) throw new NotFoundException('Examen no encontrado');
    if (!(await this.studentHasActiveExam(studentId, examId)))
      throw new ForbiddenException(
        'El examen no está asignado a un grupo activo del alumno',
      );
    let request = await this.accessRequestModel
      .findOne({ examId, studentId })
      .sort({ createdAt: -1 })
      .exec();
    if (
      request?.status === ExamAccessRequestStatus.APPROVED &&
      !request.attemptUsed &&
      request.expiresAt &&
      new Date() > request.expiresAt
    ) {
      await this.recordExpiredAdditionalAttempt(examId, studentId, request);
      request = await this.accessRequestModel
        .findOne({ id: request.id })
        .exec();
    }
    const submissions = await this.progressModel.countDocuments({
      type: ProgressType.EXAM,
      referenceId: examId,
      userId: studentId,
    });
    const latestSubmission = await this.progressModel
      .findOne({
        type: ProgressType.EXAM,
        referenceId: examId,
        userId: studentId,
      })
      .sort({ createdAt: -1 })
      .select('score gradedAt createdAt')
      .exec();
    const deadlinePassed =
      !!exam.availableUntil && new Date() > exam.availableUntil;
    const additionalAttemptActive =
      request?.status === ExamAccessRequestStatus.APPROVED &&
      !request.attemptUsed &&
      !!request.expiresAt &&
      new Date() <= request.expiresAt;
    return {
      submissions,
      allowedAttempts: exam.maxAttempts + (additionalAttemptActive ? 1 : 0),
      availableUntil: exam.availableUntil ?? null,
      deadlinePassed,
      canSubmit:
        !deadlinePassed &&
        submissions < exam.maxAttempts + (additionalAttemptActive ? 1 : 0),
      request: request ?? null,
      additionalAttemptExpiresAt: additionalAttemptActive
        ? request.expiresAt
        : null,
      score: latestSubmission?.score ?? null,
      pendingGrade: !!latestSubmission && latestSubmission.score === undefined,
    };
  }

  async requestExamAccess(examId: string, studentId: string, reason?: string) {
    const access = await this.getExamAccess(examId, studentId);
    if (access.deadlinePassed)
      throw new BadRequestException(
        'No se puede solicitar una oportunidad después de la fecha límite',
      );
    if (access.canSubmit)
      throw new BadRequestException('Aún tienes un intento disponible');
    const existingRequest = await this.accessRequestModel.exists({
      examId,
      studentId,
    });
    if (existingRequest)
      throw new BadRequestException(
        'Solo puedes solicitar una oportunidad adicional por examen',
      );
    return new this.accessRequestModel({ examId, studentId, reason }).save();
  }

  async getExamAccessRequests(teacherId: string): Promise<any[]> {
    const groups = await this.groupModel
      .find({ $or: [{ teacherId }, { users: teacherId }] })
      .select('id users exams')
      .exec();
    const examIds = [...new Set(groups.flatMap((group) => group.exams))];
    const studentIds = [
      ...new Set(
        (
          await Promise.all(
            groups.map((group) => this.getActiveStudentIdsForGroup(group)),
          )
        ).flat(),
      ),
    ];
    const requests = await this.accessRequestModel
      .find({ examId: { $in: examIds }, studentId: { $in: studentIds } })
      .sort({ createdAt: -1 })
      .exec();
    const [students, exams] = await Promise.all([
      this.userModel
        .find({ id: { $in: studentIds }, userType: UserType.STUDENT })
        .select('id firstName lastNameFather lastNameMother registrationNumber')
        .exec(),
      this.examModel
        .find({ id: { $in: examIds } })
        .select('id title availableUntil')
        .exec(),
    ]);
    return requests.map((request) => ({
      ...request.toJSON(),
      student: students.find((student) => student.id === request.studentId),
      exam: exams.find((exam) => exam.id === request.examId),
    }));
  }

  async reviewExamAccessRequest(
    id: string,
    status: ExamAccessRequestStatus.APPROVED | ExamAccessRequestStatus.REJECTED,
    teacherId: string,
  ) {
    const request = await this.accessRequestModel.findOne({ id }).exec();
    if (!request) throw new NotFoundException('Solicitud no encontrada');
    if (request.status !== ExamAccessRequestStatus.PENDING)
      throw new BadRequestException('La solicitud ya fue revisada');
    if (
      !(await this.teacherCanManageStudentExam(
        teacherId,
        request.studentId,
        request.examId,
      ))
    )
      throw new ForbiddenException('No puedes revisar esta solicitud');
    const exam = await this.examModel.findOne({ id: request.examId }).exec();
    if (!exam) throw new NotFoundException('Examen no encontrado');
    if (
      status === ExamAccessRequestStatus.APPROVED &&
      exam.availableUntil &&
      new Date() > exam.availableUntil
    ) {
      throw new BadRequestException(
        'No se puede autorizar una oportunidad después de la fecha límite del examen',
      );
    }
    request.status = status;
    request.reviewedBy = teacherId;
    request.reviewedAt = new Date();
    if (status === ExamAccessRequestStatus.APPROVED) {
      const oneDayFromApproval = new Date(
        request.reviewedAt.getTime() + 24 * 60 * 60 * 1000,
      );
      request.expiresAt =
        exam.availableUntil && exam.availableUntil < oneDayFromApproval
          ? exam.availableUntil
          : oneDayFromApproval;
    }
    return request.save();
  }

  private async recordExpiredAdditionalAttempt(
    examId: string,
    studentId: string,
    request: ExamAccessRequestDocument,
  ): Promise<void> {
    request.attemptUsed = true;
    await Promise.all([
      request.save(),
      new this.progressModel({
        userId: studentId,
        type: ProgressType.EXAM,
        referenceId: examId,
        answers: [],
        score: 0,
        feedback: 'La oportunidad adicional venció sin entregar el examen.',
        gradedAt: new Date(),
      }).save(),
    ]);
  }

  async getStudentExamResults(studentId: string, teacherId: string) {
    const teacherGroups = await this.groupModel
      .find({ $or: [{ teacherId }, { users: teacherId }] })
      .select('id users exams')
      .exec();
    const groups = [] as GroupsDocument[];
    for (const group of teacherGroups) {
      if ((await this.getActiveStudentIdsForGroup(group)).includes(studentId))
        groups.push(group);
    }
    const examIds = [
      ...new Set(
        groups
          .flatMap((group) => (Array.isArray(group.exams) ? group.exams : []))
          .filter((examId): examId is string => typeof examId === 'string'),
      ),
    ];
    if (examIds.length === 0) {
      return [];
    }
    const expiredRequests = await this.accessRequestModel
      .find({
        examId: { $in: examIds },
        studentId,
        status: ExamAccessRequestStatus.APPROVED,
        attemptUsed: false,
        expiresAt: { $lte: new Date() },
      })
      .exec();
    await Promise.all(
      expiredRequests.map((request) =>
        this.recordExpiredAdditionalAttempt(request.examId, studentId, request),
      ),
    );
    const submissions = await this.progressModel
      .find({
        type: ProgressType.EXAM,
        userId: studentId,
        referenceId: { $in: examIds },
      })
      .sort({ createdAt: -1 })
      .exec();
    const latestByExam = new Map<string, Progress>();
    for (const submission of submissions) {
      const referenceId = Array.isArray(submission.referenceId)
        ? submission.referenceId[0]
        : submission.referenceId;
      if (
        typeof referenceId === 'string' &&
        examIds.includes(referenceId) &&
        !latestByExam.has(referenceId)
      ) {
        latestByExam.set(referenceId, submission);
      }
    }
    const exams = await this.examModel.find({ id: { $in: examIds } }).exec();
    return exams.map((exam) => ({
      groupId: groups.find(
        (group) => Array.isArray(group.exams) && group.exams.includes(exam.id),
      )?.id,
      exam,
      submission: latestByExam.get(exam.id) ?? null,
    }));
  }

  async gradeExam(
    id: string,
    answers: any[],
    feedback: string | undefined,
    graderId: string,
    teacherId?: string,
  ): Promise<Progress> {
    const progress = await this.progressModel.findById(id).exec();
    if (!progress || progress.type !== ProgressType.EXAM) {
      throw new NotFoundException(`Exam submission with ID "${id}" not found`);
    }

    const examId = Array.isArray(progress.referenceId)
      ? progress.referenceId[0]
      : progress.referenceId;

    if (teacherId) {
      if (
        !(await this.teacherCanManageStudentExam(
          teacherId,
          progress.userId,
          String(examId),
        ))
      ) {
        throw new ForbiddenException('No puedes calificar esta entrega');
      }
    }

    const exam = await this.examModel.findOne({ id: examId }).exec();
    if (!exam) {
      throw new NotFoundException('Examen no encontrado');
    }

    const gradedAnswers = progress.answers.map((answer) => {
      const question = exam.questions.find(
        (item) => String(item.id) === String(answer.questionId),
      );
      const evaluation = answers.find(
        (item) => item.questionId === answer.questionId,
      );
      const isCorrect =
        question?.type === 'single'
          ? answer.answer === question.correctAnswers
          : question?.type === 'multiple'
            ? this.haveSameAnswers(answer.answers, question.correctAnswers)
            : evaluation?.isCorrect === true;
      return { ...answer, isCorrect };
    });
    progress.answers = gradedAnswers;
    const correctAnswers = gradedAnswers.filter(
      (answer) => answer.isCorrect,
    ).length;
    progress.score = gradedAnswers.length
      ? Math.round((correctAnswers / gradedAnswers.length) * 100)
      : 0;
    progress.feedback = feedback;
    progress.gradedBy = graderId;
    progress.gradedAt = new Date();
    return progress.save();
  }

  private haveSameAnswers(answer: unknown, expected: unknown): boolean {
    const submitted = Array.isArray(answer) ? answer.map(String).sort() : [];
    const correct = Array.isArray(expected) ? expected.map(String).sort() : [];
    return (
      submitted.length === correct.length &&
      submitted.every((value, index) => value === correct[index])
    );
  }

  private async studentHasActiveExam(
    studentId: string,
    examId: string,
  ): Promise<boolean> {
    const enrollmentGroupIds = await this.enrollmentModel
      .find({ studentId, status: EnrollmentStatus.IN_PROGRESS })
      .distinct('groupId')
      .exec();
    const historicalEnrollmentGroupIds = await this.enrollmentModel
      .find({ studentId })
      .distinct('groupId')
      .exec();
    const group = await this.groupModel.exists({
      exams: examId,
      state: 'active',
      $or: [
        { id: { $in: enrollmentGroupIds } },
        { users: studentId, id: { $nin: historicalEnrollmentGroupIds } },
      ],
    });
    return !!group;
  }

  private async getActiveStudentIdsForGroup(
    group: Pick<Groups, 'id' | 'users'>,
  ): Promise<string[]> {
    const enrollmentStudentIds = await this.enrollmentModel
      .find({ groupId: group.id, status: EnrollmentStatus.IN_PROGRESS })
      .distinct('studentId')
      .exec();
    if (enrollmentStudentIds.length > 0) return enrollmentStudentIds;
    const hasEnrollmentHistory = await this.enrollmentModel.exists({
      groupId: group.id,
    });
    if (hasEnrollmentHistory) return [];
    const legacyStudents = await this.userModel
      .find({ id: { $in: group.users ?? [] }, userType: UserType.STUDENT })
      .distinct('id')
      .exec();
    return legacyStudents;
  }

  private async teacherCanManageStudentExam(
    teacherId: string,
    studentId: string,
    examId: string,
  ): Promise<boolean> {
    const groups = await this.groupModel
      .find({
        exams: examId,
        $or: [{ teacherId }, { users: teacherId }],
      })
      .select('id users')
      .exec();
    for (const group of groups) {
      if ((await this.getActiveStudentIdsForGroup(group)).includes(studentId))
        return true;
    }
    return false;
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
