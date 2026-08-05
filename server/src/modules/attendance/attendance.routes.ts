import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { validateBody, validateQuery } from '../../middleware/validate';
import { requireAuth, requireRole } from '../../middleware/auth';
import {
  upsertAttendanceSchema,
  sessionDateSchema,
  syncScheduleSchema,
  listAttendanceQuerySchema,
} from './attendance.schemas';
import { upsertAttendance, addSessionDate, syncSchedule, listAttendance } from './attendance.service';

export const attendanceRouter = Router();

attendanceRouter.use(requireAuth, requireRole('TEACHER'));

attendanceRouter.get(
  '/',
  validateQuery(listAttendanceQuerySchema),
  asyncHandler(async (req, res) => {
    const { classId, month, studentId } = req.query as unknown as {
      classId?: string;
      month?: string;
      studentId?: string;
    };
    res.json(await listAttendance({ classId, month, studentId }));
  })
);

attendanceRouter.put(
  '/',
  validateBody(upsertAttendanceSchema),
  asyncHandler(async (req, res) => {
    res.json(await upsertAttendance(req.body));
  })
);

attendanceRouter.post(
  '/session-date',
  validateBody(sessionDateSchema),
  asyncHandler(async (req, res) => {
    res.json(await addSessionDate(req.body.classId, req.body.date));
  })
);

attendanceRouter.post(
  '/sync-schedule',
  validateBody(syncScheduleSchema),
  asyncHandler(async (req, res) => {
    res.json(await syncSchedule(req.body.classId, req.body.month));
  })
);
