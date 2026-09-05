import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Groups, GroupsDocument } from './schemas/groups.schema';
import { UpdateGroupsDto } from './dto/update-groups.dto';
import { CreateGroupsDto } from './dto/create-groups.dto';
import { User, UserDocument, UserType } from '../users/schemas/user.schema';
import {
  EnrollmentStatus,
  GroupEnrollment,
  GroupEnrollmentDocument,
} from './schemas/group-enrollment.schema';
import {
  CourseTemplate,
  CourseTemplateDocument,
} from '../course-templates/schemas/course-template.schema';
import { CourseTemplateStatus } from '../course-templates/course-template-status.enum';

@Injectable()
export class GroupsService {
  constructor(
    @InjectModel(Groups.name) private groupModel: Model<GroupsDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(CourseTemplate.name)
    private courseTemplateModel: Model<CourseTemplateDocument>,
    @InjectModel(GroupEnrollment.name)
    private enrollmentModel: Model<GroupEnrollmentDocument>,
  ) {}

  async findAll(): Promise<Groups[]> {
    return this.groupModel.find().exec();
  }

  async getGroupWithRelations(userId: string): Promise<any[]> {
    const enrollments = await this.enrollmentModel
      .find({ studentId: userId })
      .sort({ createdAt: -1 })
      .select('groupId status createdAt updatedAt')
      .exec();
    const enrollmentGroupIds = [
      ...new Set(enrollments.map((enrollment) => enrollment.groupId)),
    ];
    const enrollmentByGroup = new Map(
      enrollments.map((enrollment) => [enrollment.groupId, enrollment]),
    );
    const groups = await this.groupModel
      .find({
        $or: [
          { users: userId },
          { teacherId: userId },
          { id: { $in: enrollmentGroupIds } },
        ],
      })
      .populate({
        path: 'lessons',
        select: 'id title instructions createdAt',
        localField: 'lessons',
        foreignField: 'id',
        options: { sort: { createdAt: -1 } },
      })
      .populate({
        path: 'exams',
        select: 'id title instructions', // Incluye únicamente los campos seleccionados
        localField: 'exams',
        foreignField: 'id',
      })
      .populate({
        path: 'games',
        select: 'id title instructions url data type', // Incluye únicamente los campos seleccionados
        localField: 'games',
        foreignField: 'id',
      })
      .select('-users') // Excluye explícitamente la propiedad users
      .exec();
    return groups.map((group) => {
      const enrollment = enrollmentByGroup.get(group.id);
      return {
        ...group.toJSON(),
        enrollmentStatus: enrollment?.status,
        enrollmentUpdatedAt: enrollment?.updatedAt,
      };
    });
  }

  async getStudentsForTeacher(teacherId: string): Promise<any[]> {
    const groups = await this.groupModel
      .find({ $or: [{ teacherId }, { users: teacherId }] })
      .select('id users')
      .exec();
    const groupIds = groups.map((group) => group.id);
    const enrollments = await this.enrollmentModel
      .find({
        groupId: { $in: groupIds },
        status: EnrollmentStatus.IN_PROGRESS,
      })
      .exec();
    const enrolledGroupIds = await this.enrollmentModel
      .find({ groupId: { $in: groupIds } })
      .distinct('groupId')
      .exec();
    const legacyGroups = groups.filter(
      (group) => !enrolledGroupIds.includes(group.id),
    );
    const legacyStudentIds = await this.userModel
      .find({
        id: { $in: legacyGroups.flatMap((group) => group.users ?? []) },
        userType: UserType.STUDENT,
        state: 'active',
      })
      .distinct('id')
      .exec();
    const studentIds = [
      ...new Set([
        ...enrollments.map((enrollment) => enrollment.studentId),
        ...legacyStudentIds,
      ]),
    ];
    const students = await this.userModel
      .find({
        id: { $in: studentIds },
        userType: UserType.STUDENT,
      })
      .select(
        'id firstName lastNameFather lastNameMother registrationNumber email state userType',
      )
      .exec();
    const groupByStudent = new Map<string, string>([
      ...enrollments.map(
        (enrollment) =>
          [enrollment.studentId, enrollment.groupId] as [string, string],
      ),
      ...legacyGroups.flatMap((group) =>
        legacyStudentIds
          .filter((studentId) => group.users?.includes(studentId))
          .map((studentId) => [studentId, group.id] as [string, string]),
      ),
    ]);
    return students.map((student) => ({
      ...student.toJSON(),
      currentGroupId: groupByStudent.get(student.id),
    }));
  }

  async getActiveStudentIds(
    groupId: string,
    teacherId?: string,
  ): Promise<string[]> {
    await this.ensureTeacherCanManageGroup(groupId, teacherId);
    return this.enrollmentModel
      .find({ groupId, status: EnrollmentStatus.IN_PROGRESS })
      .distinct('studentId')
      .exec();
  }

  async findOne(id: string): Promise<Groups> {
    return this.groupModel.findOne({ id }).exec();
  }

  async create(createGroupsDto: CreateGroupsDto): Promise<Groups> {
    const { teacherId, studentIds, ...groupData } = createGroupsDto;
    if (teacherId) await this.validateTeacher(teacherId);
    const templateData = await this.getTemplateData(
      groupData.templateId,
      groupData.course,
      groupData.level,
    );
    const group = new this.groupModel({
      state: 'active',
      ...groupData,
      ...templateData,
      games: [],
      users: teacherId ? [teacherId] : [],
      teacherId,
    });
    if (studentIds?.length && !teacherId) {
      throw new BadRequestException(
        'Debes asignar un profesor antes de agregar estudiantes al grupo',
      );
    }
    const savedGroup = await group.save();
    if (studentIds)
      await this.syncStudentEnrollments(savedGroup.id, studentIds);
    return savedGroup;
  }

  private async getTemplateData(
    templateId?: string,
    course?: string,
    level?: string,
  ): Promise<
    Pick<Groups, 'templateId' | 'templateVersion' | 'lessons' | 'exams'>
  > {
    if (!templateId) return { lessons: [], exams: [] };

    const template = await this.courseTemplateModel
      .findOne({ id: templateId })
      .exec();
    if (!template || template.status !== CourseTemplateStatus.ACTIVE) {
      throw new BadRequestException(
        'La plantilla seleccionada no existe o no está activa',
      );
    }
    if (template.course !== course || template.level !== level) {
      throw new BadRequestException(
        'El curso y nivel del grupo deben coincidir con la plantilla',
      );
    }

    return {
      templateId: template.id,
      templateVersion: template.version,
      lessons: [...template.lessons],
      exams: [...template.exams],
    };
  }

  async updateGroup(
    id: string,
    updateGroupsDto: UpdateGroupsDto,
  ): Promise<GroupsDocument> {
    const currentGroup = await this.groupModel.findOne({ id }).exec();
    if (!currentGroup) {
      throw new NotFoundException(`User with username "${id}" not found`);
    }

    const groupData = { ...updateGroupsDto };
    delete groupData.lessons;
    delete groupData.exams;
    delete groupData.games;
    delete groupData.users;
    const studentIds = groupData.studentIds;
    delete groupData.studentIds;
    const teacherId = groupData.teacherId;
    delete groupData.teacherId;
    if (teacherId) await this.validateTeacher(teacherId);
    if (studentIds?.length && !teacherId && !currentGroup.teacherId) {
      throw new BadRequestException(
        'Debes asignar un profesor antes de agregar estudiantes al grupo',
      );
    }
    const templateData = groupData.templateId
      ? await this.getTemplateData(
          groupData.templateId,
          currentGroup.course,
          currentGroup.level,
        )
      : {};
    if (studentIds)
      await this.syncStudentEnrollments(id, studentIds, currentGroup.users);

    const updatedUser = await this.groupModel
      .findOneAndUpdate(
        { id },
        {
          ...groupData,
          ...templateData,
          ...(teacherId ? { teacherId, users: [teacherId] } : {}),
        },
        { new: true },
      )
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with username "${id}" not found`);
    }

    return updatedUser;
  }

  async completeStudent(
    groupId: string,
    studentId: string,
    teacherId?: string,
  ): Promise<GroupEnrollment> {
    await this.ensureTeacherCanManageGroup(groupId, teacherId);
    return this.changeEnrollmentStatus(
      groupId,
      studentId,
      EnrollmentStatus.COMPLETED,
      teacherId,
    );
  }

  async withdrawStudent(
    groupId: string,
    studentId: string,
    teacherId?: string,
  ): Promise<GroupEnrollment> {
    await this.ensureTeacherCanManageGroup(groupId, teacherId);
    return this.changeEnrollmentStatus(
      groupId,
      studentId,
      EnrollmentStatus.WITHDRAWN,
      teacherId,
    );
  }

  private async syncStudentEnrollments(
    groupId: string,
    studentIds: string[],
    legacyUserIds: string[] = [],
  ): Promise<void> {
    const uniqueStudentIds = [...new Set(studentIds)];
    const studentCount = await this.userModel
      .countDocuments({
        id: { $in: uniqueStudentIds },
        userType: UserType.STUDENT,
        state: 'active',
      })
      .exec();
    if (studentCount !== uniqueStudentIds.length) {
      throw new BadRequestException(
        'Solo se pueden asignar estudiantes activos',
      );
    }

    const [otherEnrollments, legacyGroups] = await Promise.all([
      this.enrollmentModel
        .find({
          studentId: { $in: uniqueStudentIds },
          groupId: { $ne: groupId },
          status: EnrollmentStatus.IN_PROGRESS,
        })
        .exec(),
      this.groupModel
        .find({
          id: { $ne: groupId },
          users: { $in: uniqueStudentIds },
          state: 'active',
        })
        .select('id users')
        .exec(),
    ]);
    if (otherEnrollments.length > 0 || legacyGroups.length > 0) {
      throw new BadRequestException(
        'Un estudiante solo puede tener un grupo en curso',
      );
    }

    const activeEnrollments = await this.enrollmentModel
      .find({ groupId, status: EnrollmentStatus.IN_PROGRESS })
      .exec();
    const legacyStudentIds = await this.userModel
      .find({ id: { $in: legacyUserIds }, userType: UserType.STUDENT })
      .distinct('id')
      .exec();
    const previouslyEnrolledIds = await this.enrollmentModel
      .find({ groupId, studentId: { $in: legacyStudentIds } })
      .distinct('studentId')
      .exec();
    const legacyEnrollments = legacyStudentIds
      .filter((studentId) => !previouslyEnrolledIds.includes(studentId))
      .map((studentId) => ({
        groupId,
        studentId,
        status: uniqueStudentIds.includes(studentId)
          ? EnrollmentStatus.IN_PROGRESS
          : EnrollmentStatus.WITHDRAWN,
        ...(uniqueStudentIds.includes(studentId)
          ? {}
          : { withdrawnAt: new Date() }),
      }));
    if (legacyEnrollments.length > 0)
      await this.enrollmentModel.insertMany(legacyEnrollments);
    const activeStudentIds = new Set(
      activeEnrollments.map((enrollment) => enrollment.studentId),
    );
    const legacyActiveStudentIds = new Set(
      legacyEnrollments
        .filter(
          (enrollment) => enrollment.status === EnrollmentStatus.IN_PROGRESS,
        )
        .map((enrollment) => enrollment.studentId),
    );
    const newStudentIds = uniqueStudentIds.filter(
      (studentId) =>
        !activeStudentIds.has(studentId) &&
        !legacyActiveStudentIds.has(studentId),
    );
    if (newStudentIds.length > 0) {
      await this.enrollmentModel.insertMany(
        newStudentIds.map((studentId) => ({ groupId, studentId })),
      );
    }

    await this.enrollmentModel
      .updateMany(
        {
          groupId,
          status: EnrollmentStatus.IN_PROGRESS,
          studentId: { $nin: uniqueStudentIds },
        },
        { status: EnrollmentStatus.WITHDRAWN, withdrawnAt: new Date() },
      )
      .exec();
  }

  private async validateTeacher(teacherId: string): Promise<void> {
    const teacher = await this.userModel.exists({
      id: teacherId,
      userType: UserType.TEACHER,
      state: 'active',
    });
    if (!teacher)
      throw new BadRequestException('El grupo debe tener un profesor activo');
  }

  private async ensureTeacherCanManageGroup(
    groupId: string,
    teacherId?: string,
  ): Promise<void> {
    if (!teacherId) return;
    const group = await this.groupModel.exists({
      id: groupId,
      $or: [{ teacherId }, { users: teacherId }],
    });
    if (!group)
      throw new BadRequestException(
        'No puedes administrar estudiantes de este grupo',
      );
  }

  private async changeEnrollmentStatus(
    groupId: string,
    studentId: string,
    status: EnrollmentStatus.COMPLETED | EnrollmentStatus.WITHDRAWN,
    teacherId?: string,
  ): Promise<GroupEnrollment> {
    const now = new Date();
    const enrollment = await this.enrollmentModel
      .findOneAndUpdate(
        { groupId, studentId, status: EnrollmentStatus.IN_PROGRESS },
        status === EnrollmentStatus.COMPLETED
          ? { status, completedAt: now, completedBy: teacherId }
          : { status, withdrawnAt: now, withdrawnBy: teacherId },
        { new: true },
      )
      .exec();
    if (!enrollment)
      throw new NotFoundException(
        'No existe una inscripción activa para este estudiante',
      );
    return enrollment;
  }

  async deleteUserById(customId: string): Promise<void> {
    const result = await this.groupModel.deleteOne({ id: customId });

    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with id ${customId} not found`);
    }
  }
}
