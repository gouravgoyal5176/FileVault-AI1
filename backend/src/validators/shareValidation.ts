import { z } from 'zod';

export const shareFileSchema = z.object({
  fileId: z.string().uuid('Invalid file ID format'),
  recipientEmail: z.string().trim().email('Invalid recipient email format'),
  permission: z.enum(['VIEW', 'DOWNLOAD'], {
    invalid_type_error: "Permission must be 'VIEW' or 'DOWNLOAD'",
  }),
  expiresAt: z.string().optional().nullable(),
});

export type ShareFileInput = z.infer<typeof shareFileSchema>;
