import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { validateBody } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth';
import { createLoginRateLimiter } from '../../middleware/loginRateLimiter';
import { AppError } from '../../middleware/AppError';
import { teacherLoginSchema, portalLoginSchema } from './auth.schemas';
import { loginTeacher, loginPortal, getTeacherProfile, getPortalProfile } from './auth.service';

export const authRouter = Router();

authRouter.post(
  '/teacher/login',
  createLoginRateLimiter(),
  validateBody(teacherLoginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const token = await loginTeacher(email, password);
    res.json({ token });
  })
);

authRouter.post(
  '/portal/login',
  createLoginRateLimiter(),
  validateBody(portalLoginSchema),
  asyncHandler(async (req, res) => {
    const { phone, accessCode } = req.body;
    const token = await loginPortal(phone, accessCode);
    res.json({ token });
  })
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user!.role === 'TEACHER') {
      res.json(await getTeacherProfile(req.user!.teacherId!));
      return;
    }
    if (req.user!.role === 'PORTAL') {
      res.json(await getPortalProfile(req.user!.studentId!));
      return;
    }
    throw new AppError(401, 'UNAUTHORIZED', 'Token không hợp lệ');
  })
);
