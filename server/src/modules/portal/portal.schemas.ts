import { z } from 'zod';

export const confirmPaymentSchema = z.object({
  billId: z.string().min(1, 'Thiếu billId'),
});
