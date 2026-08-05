import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { validateBody } from '../../middleware/validate';
import { requireAuth, requireRole } from '../../middleware/auth';
import { upsertAttendanceSchema, sessionDateSchema, syncScheduleSchema } from './attendance.schemas';
import { upsertAttendance, addSessionDate, syncSchedule } from './attendance.service';

export const attendanceRouter = Router();

attendanceRouter.use(requireAuth, requireRole('TEACHER'));

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
