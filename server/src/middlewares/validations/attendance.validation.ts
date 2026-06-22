import { z } from 'zod';

export const recordAttendanceSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  studentIdInput: z.string().min(1, 'Student ID input is required'),
});

export type RecordAttendanceBody = z.infer<typeof recordAttendanceSchema>;
