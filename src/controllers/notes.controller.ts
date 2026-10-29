import { Request, Response, NextFunction } from 'express';
import { notesService } from '../services/notes.service';

export class NotesController {
  async createNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const note = await notesService.createNote(req.user!, req.body);
      res.status(201).json({
        success: true,
        message: 'Note created successfully',
        data: note
      });
    } catch (error) {
      next(error);
    }
  }

  async getNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await notesService.getNotes(req.user!);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getNoteById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const note = await notesService.getNoteById(req.params.id, req.user!);
      res.status(200).json({
        success: true,
        data: note
      });
    } catch (error) {
      next(error);
    }
  }

  async updateNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const note = await notesService.updateNote(req.params.id, req.user!, req.body);
      res.status(200).json({
        success: true,
        message: 'Note updated successfully',
        data: note
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await notesService.deleteNote(req.params.id, req.user!);
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }
}

export const notesController = new NotesController();
