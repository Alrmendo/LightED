import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { validateBody } from '../../middleware/validate';
import { requireAuth, requireRole } from '../../middleware/auth';
import { bankConfigSchema } from './bankConfig.schemas';
import { getBankConfig, updateBankConfig } from './bankConfig.service';

export const bankConfigRouter = Router();

bankConfigRouter.use(requireAuth, requireRole('TEACHER'));

bankConfigRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(await getBankConfig());
  })
);

bankConfigRouter.put(
  '/',
  validateBody(bankConfigSchema),
  asyncHandler(async (req, res) => {
    res.json(await updateBankConfig(req.body));
  })
);
