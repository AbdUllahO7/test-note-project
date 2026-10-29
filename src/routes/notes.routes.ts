import { Router } from 'express';
import { notesController } from '../controllers/notes.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateBody, validateParams } from '../middlewares/validate.middleware';
import { createNoteSchema, updateNoteSchema, noteIdParamSchema } from '../schemas/note.schema';

const router = Router();

// All notes routes require authentication
router.use(authenticate);

router.post('/', validateBody(createNoteSchema), notesController.createNote);
router.get('/', notesController.getNotes);
router.get('/:id', validateParams(noteIdParamSchema), notesController.getNoteById);
router.put('/:id', validateParams(noteIdParamSchema), validateBody(updateNoteSchema), notesController.updateNote);
router.delete('/:id', validateParams(noteIdParamSchema), notesController.deleteNote);

export default router;
