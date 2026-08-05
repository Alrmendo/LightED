import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { validateBody } from '../../middleware/validate';
import { requireAuth, requireRole } from '../../middleware/auth';
import { updateBillStatusSchema } from './bills.schemas';
import { listBills, updateBillStatus } from './bills.service';

export const billsRouter = Router();

billsRouter.use(requireAuth, requireRole('TEACHER'));

billsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { classId, month, studentId } = req.query;
    res.json(
      await listBills({
        classId: typeof classId === 'string' ? classId : undefined,
        month: typeof month === 'string' ? month : undefined,
        studentId: typeof studentId === 'string' ? studentId : undefined,
      })
    );
  })
);

billsRouter.put(
  '/:id/status',
  validateBody(updateBillStatusSchema),
  asyncHandler(async (req, res) => {
    res.json(await updateBillStatus(req.params.id, req.body));
  })
);
