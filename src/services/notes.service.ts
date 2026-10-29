import { prisma } from '../config/db';
import { Role } from '../types/role';
import { AppError } from '../middlewares/error.middleware';
import { CreateNoteInput, UpdateNoteInput } from '../schemas/note.schema';
import { AuthUser } from '../types/express';

export class NotesService {
  /**
   * Create a new note assigned to the authenticated user
   */
  async createNote(user: AuthUser, input: CreateNoteInput) {
    const note = await prisma.note.create({
      data: {
        title: input.title,
        content: input.content,
        userId: user.id
      },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    return note;
  }

  /**
   * Retrieve notes:
   * - ADMIN: Retrieves all notes across all users
   * - USER: Retrieves ONLY notes belonging to the authenticated user
   */
  async getNotes(user: AuthUser) {
    const isAdmin = user.role === Role.ADMIN;

    const notes = await prisma.note.findMany({
      where: isAdmin ? {} : { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    return {
      count: notes.length,
      scope: isAdmin ? 'ALL_NOTES (Admin view)' : 'USER_ONLY (Personal view)',
      notes
    };
  }

  /**
   * Get a single note by ID:
   * - ADMIN: Can access any note
   * - USER: Can access ONLY their own note
   */
  async getNoteById(id: string, user: AuthUser) {
    const note = await prisma.note.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    if (!note) {
      throw new AppError('Note not found', 404);
    }

    // IDOR Protection: Non-admin users cannot access notes belonging to others
    if (user.role !== Role.ADMIN && note.userId !== user.id) {
      throw new AppError('Note not found', 404); // Return 404 to avoid ID enumeration
    }

    return note;
  }

  /**
   * Update a note:
   * - USER: Can only update their own notes
   * - ADMIN: Can update any note
   */
  async updateNote(id: string, user: AuthUser, input: UpdateNoteInput) {
    const existingNote = await prisma.note.findUnique({
      where: { id }
    });

    if (!existingNote) {
      throw new AppError('Note not found', 404);
    }

    // Ownership check
    if (user.role !== Role.ADMIN && existingNote.userId !== user.id) {
      throw new AppError('Note not found', 404);
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.content !== undefined && { content: input.content })
      },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    return updatedNote;
  }

  /**
   * Delete a note:
   * - USER: Can only delete their own notes
   * - ADMIN: Can delete any note
   */
  async deleteNote(id: string, user: AuthUser) {
    const existingNote = await prisma.note.findUnique({
      where: { id }
    });

    if (!existingNote) {
      throw new AppError('Note not found', 404);
    }

    // Ownership check
    if (user.role !== Role.ADMIN && existingNote.userId !== user.id) {
      throw new AppError('Note not found', 404);
    }

    await prisma.note.delete({
      where: { id }
    });

    return { message: 'Note deleted successfully' };
  }
}

export const notesService = new NotesService();
