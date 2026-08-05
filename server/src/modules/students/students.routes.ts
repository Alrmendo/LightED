import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { validateBody, validateQuery } from '../../middleware/validate';
import { requireAuth, requireRole } from '../../middleware/auth';
import { studentSchema, listStudentsQuerySchema } from './students.schemas';
import {
  listStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  resetAccessCode,
  revokeAccessCode,
} from './students.service';

export const studentsRouter = Router();

studentsRouter.use(requireAuth, requireRole('TEACHER'));

studentsRouter.get(
  '/',
  validateQuery(listStudentsQuerySchema),
  asyncHandler(async (req, res) => {
    const { classId } = req.query as unknown as { classId?: string };
    res.json(await listStudents(classId));
  })
);

studentsRouter.post(
  '/',
  validateBody(studentSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await createStudent(req.body));
  })
);

studentsRouter.put(
  '/:id',
  validateBody(studentSchema),
  asyncHandler(async (req, res) => {
    res.json(await updateStudent(req.params.id, req.body));
  })
);

studentsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await deleteStudent(req.params.id);
    res.status(204).send();
  })
);

studentsRouter.post(
  '/:id/access-code',
  asyncHandler(async (req, res) => {
    const accessCode = await resetAccessCode(req.params.id);
    res.json({ accessCode });
  })
);

studentsRouter.post(
  '/:id/access-code/revoke',
  asyncHandler(async (req, res) => {
    await revokeAccessCode(req.params.id);
    res.status(204).send();
  })
);
