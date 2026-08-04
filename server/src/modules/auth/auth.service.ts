import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { AppError } from '../../middleware/AppError';
import type { AuthTokenPayload } from '../../middleware/auth';

const TOKEN_EXPIRES_IN = '7d';
const INVALID_CREDENTIALS_MESSAGE = 'Thông tin đăng nhập không đúng';

function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
}

export async function loginTeacher(email: string, password: string): Promise<string> {
  const teacher = await prisma.teacherAccount.findUnique({ where: { email } });
  if (!teacher) throw new AppError(401, 'INVALID_CREDENTIALS', INVALID_CREDENTIALS_MESSAGE);

  const passwordMatches = await bcrypt.compare(password, teacher.passwordHash);
  if (!passwordMatches) throw new AppError(401, 'INVALID_CREDENTIALS', INVALID_CREDENTIALS_MESSAGE);

  return signToken({ role: 'TEACHER', teacherId: teacher.id });
}

export async function loginPortal(phone: string, accessCode: string): Promise<string> {
  // Không dùng findUnique/findFirst theo phone: 2 anh chị em có thể dùng chung SĐT phụ huynh
  // nhưng mỗi học sinh có PIN riêng — phải thử accessCode với TẤT CẢ học sinh khớp SĐT đó.
  const candidates = await prisma.student.findMany({
    where: { phone, portalAccessEnabled: true, portalAccessCodeHash: { not: null } },
  });

  for (const student of candidates) {
    const codeMatches = await bcrypt.compare(accessCode, student.portalAccessCodeHash!);
    if (codeMatches) {
      return signToken({ role: 'PORTAL', studentId: student.id });
    }
  }

  throw new AppError(401, 'INVALID_CREDENTIALS', INVALID_CREDENTIALS_MESSAGE);
}

export async function getTeacherProfile(teacherId: string) {
  const teacher = await prisma.teacherAccount.findUnique({ where: { id: teacherId } });
  if (!teacher) throw new AppError(401, 'UNAUTHORIZED', 'Tài khoản không còn tồn tại');
  return { role: 'TEACHER' as const, id: teacher.id, email: teacher.email, name: teacher.name };
}

export async function getPortalProfile(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { class: { select: { id: true, name: true } } },
  });
  if (!student || !student.portalAccessEnabled) {
    throw new AppError(401, 'UNAUTHORIZED', 'Tài khoản không còn tồn tại hoặc đã bị thu hồi quyền truy cập');
  }
  return {
    role: 'PORTAL' as const,
    studentId: student.id,
    name: student.name,
    parentName: student.parentName,
    phone: student.phone,
    classId: student.classId,
    className: student.class.name,
  };
}
