import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { validateBody } from '../../middleware/validate';
import { requireAuth, requirePortalOwnership } from '../../middleware/auth';
import { confirmPaymentSchema } from './portal.schemas';
import { getPortalMe, confirmPayment } from './portal.service';

export const portalRouter = Router();

portalRouter.use(requireAuth, requirePortalOwnership);

portalRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    res.json(await getPortalMe(req.user!.studentId!));
  })
);

portalRouter.post(
  '/confirm-payment',
  validateBody(confirmPaymentSchema),
  asyncHandler(async (req, res) => {
    const bill = await confirmPayment(req.user!.studentId!, req.body.billId);
    res.json(bill);
  })
);
