import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { validateBody, validateQuery } from '../../middleware/validate';
import { requireAuth, requireRole } from '../../middleware/auth';
import { updateBillStatusSchema, listBillsQuerySchema } from './bills.schemas';
import { listBills, updateBillStatus } from './bills.service';

export const billsRouter = Router();

billsRouter.use(requireAuth, requireRole('TEACHER'));

billsRouter.get(
  '/',
  validateQuery(listBillsQuerySchema),
  asyncHandler(async (req, res) => {
    const { classId, month, studentId } = req.query as unknown as {
      classId?: string;
      month?: string;
      studentId?: string;
    };
    res.json(await listBills({ classId, month, studentId }));
  })
);

billsRouter.put(
  '/:id/status',
  validateBody(updateBillStatusSchema),
  asyncHandler(async (req, res) => {
    res.json(await updateBillStatus(req.params.id, req.body));
  })
);
