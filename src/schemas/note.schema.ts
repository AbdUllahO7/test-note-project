import { z } from 'zod';

export const createNoteSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title cannot exceed 200 characters'),
  content: z
    .string({ required_error: 'Content is required' })
    .trim()
    .min(1, 'Content cannot be empty')
});

export const updateNoteSchema = z
  .object({
    title: z.string().trim().min(1, 'Title cannot be empty').max(200).optional(),
    content: z.string().trim().min(1, 'Content cannot be empty').optional()
  })
  .refine((data) => data.title !== undefined || data.content !== undefined, {
    message: 'At least one field (title or content) must be provided for update'
  });

export const noteIdParamSchema = z.object({
  id: z.string().uuid('Invalid note ID format')
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
