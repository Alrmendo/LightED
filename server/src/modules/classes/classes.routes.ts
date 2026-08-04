import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { validateBody } from '../../middleware/validate';
import { requireAuth, requireRole } from '../../middleware/auth';
import { classSchema } from './classes.schemas';
import { listClasses, createClass, updateClass, deleteClass } from './classes.service';

export const classesRouter = Router();

classesRouter.use(requireAuth, requireRole('TEACHER'));

classesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(await listClasses());
  })
);

classesRouter.post(
  '/',
  validateBody(classSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await createClass(req.body));
  })
);

classesRouter.put(
  '/:id',
  validateBody(classSchema),
  asyncHandler(async (req, res) => {
    res.json(await updateClass(req.params.id, req.body));
  })
);

classesRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await deleteClass(req.params.id);
    res.status(204).send();
  })
);
