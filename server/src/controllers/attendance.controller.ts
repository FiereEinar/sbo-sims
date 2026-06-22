import asyncHandler from 'express-async-handler';
import appAssert from '../errors/appAssert';
import { BAD_REQUEST, CONFLICT, NOT_FOUND } from '../constants/http';
import AttendanceRecordModel from '../models/attendance-record.model';
import EventSessionModel from '../models/event-session.model';
import StudentModel from '../models/student.model';
import CustomResponse from '../types/response';
import {
  RecordAttendanceBody,
  recordAttendanceSchema,
} from '../middlewares/validations/attendance.validation';

/**
 * POST - Record Attendance
 * The scanner will hit this endpoint.
 */
export const record_attendance = asyncHandler(async (req, res) => {
  const parseResult = recordAttendanceSchema.safeParse(req.body);

  appAssert(
    parseResult.success,
    BAD_REQUEST,
    parseResult.error?.message || 'Invalid input data',
  );

  const { sessionId, studentIdInput }: RecordAttendanceBody = parseResult.data;

  // 1. Verify session is active
  const session = await EventSessionModel.findOne({
    _id: sessionId,
    organization: req.tenantContext!.organizationId,
  }).exec();

  appAssert(session !== null, NOT_FOUND, 'Session not found');
  appAssert(session.status === 'active', BAD_REQUEST, 'Session is not active');

  // 2. Lookup student by studentID string
  const student = await StudentModel.findOne({
    studentID: studentIdInput,
    organization: req.tenantContext!.organizationId,
  }).exec();

  appAssert(student !== null, NOT_FOUND, 'Student not found in this organization');

  // 3. Check for duplicate attendance record for this session and student
  const existingRecord = await AttendanceRecordModel.findOne({
    session: sessionId,
    student: student._id,
    organization: req.tenantContext!.organizationId,
  }).exec();

  appAssert(
    existingRecord === null,
    CONFLICT,
    'Attendance already recorded for this student in this session',
  );

  // 4. Create attendance record
  const record = new AttendanceRecordModel({
    organization: req.tenantContext!.organizationId,
    event: session.event,
    session: session._id,
    student: student._id,
    studentIdInput,
    recordedAt: new Date(),
  });

  await record.save();

  // Populate student info for immediate UI feedback
  await record.populate('student', 'firstname lastname course year studentID');

  res.json(new CustomResponse(true, record, 'Attendance recorded successfully'));
});

/**
 * GET - Read All Attendance Records for a Session
 */
export const get_session_attendance = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  appAssert(sessionId, BAD_REQUEST, 'Session ID parameter is required');

  const records = await AttendanceRecordModel.find({
    session: sessionId,
    organization: req.tenantContext!.organizationId,
  })
    .populate('student', 'firstname lastname course year studentID')
    .sort({ recordedAt: -1 })
    .exec();

  res.json(new CustomResponse(true, records, 'Attendance records retrieved successfully'));
});
