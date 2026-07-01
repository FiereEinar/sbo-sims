import asyncHandler from 'express-async-handler';
import appAssert from '../errors/appAssert';
import { BAD_REQUEST, CONFLICT, NOT_FOUND } from '../constants/http';
import AttendanceRecordModel from '../models/attendance-record.model';
import EventSessionModel from '../models/event-session.model';
import StudentModel from '../models/student.model';
import CustomResponse, { CustomPaginatedResponse } from '../types/response';
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

  appAssert(
    student !== null,
    NOT_FOUND,
    'Student not found in this organization',
  );

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

  res.json(
    new CustomResponse(true, record, 'Attendance recorded successfully'),
  );
});

/**
 * GET - Read All Attendance Records for a Session
 */
export const get_session_attendance = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { page, pageSize } = req.query;

  appAssert(sessionId, BAD_REQUEST, 'Session ID parameter is required');

  const pageNum = page ? parseInt(page as string) : 1;
  const pageSizeNum = pageSize ? parseInt(pageSize as string) : 50;
  const skipAmount = (pageNum - 1) * pageSizeNum;

  const filter = {
    session: sessionId,
    organization: req.tenantContext!.organizationId,
  };

  const records = await AttendanceRecordModel.find(filter)
    .populate('student')
    .sort({ recordedAt: -1 })
    .skip(skipAmount)
    .limit(pageSizeNum)
    .exec();

  const total = await AttendanceRecordModel.countDocuments(filter);
  const nextPage = total > skipAmount + pageSizeNum ? pageNum + 1 : -1;
  const prevPage = pageNum > 1 ? pageNum - 1 : -1;

  res.json(
    new CustomPaginatedResponse(
      true,
      records,
      'Attendance records retrieved successfully',
      nextPage,
      prevPage,
    ),
  );
});
export const download_session_attendance_pdf = asyncHandler(
  async (req, res) => {
    const { sessionId } = req.params;

    const session = await EventSessionModel.findOne({
      _id: sessionId,
      organization: req.tenantContext!.organizationId,
    }).populate('event');

    appAssert(session, NOT_FOUND, 'Session not found');

    const records = await AttendanceRecordModel.find({
      session: sessionId,
      organization: req.tenantContext!.organizationId,
    })
      .populate('student', 'firstname lastname course year studentID')
      .sort({ recordedAt: -1 })
      .exec();

    const html = `
    <html>
    <head>
      <style>
        body { font-family: sans-serif; padding: 20px; }
        h1 { font-size: 20px; margin-bottom: 5px; }
        h2 { font-size: 16px; color: #555; margin-top: 0; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 12px; }
        th { background-color: #f4f4f4; }
      </style>
    </head>
    <body>
      <h1>${(session.event as any).title}</h1>
      <h2>Session: ${session.name}</h2>
      <p>Total Attendance: ${records.length}</p>
      <table>
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Name</th>
            <th>Course & Year</th>
            <th>Time Recorded</th>
          </tr>
        </thead>
        <tbody>
          ${records
            .map(
              (r: any) => `
            <tr>
              <td>${r.student.studentID}</td>
              <td>${r.student.firstname} ${r.student.lastname}</td>
              <td>${r.student.course} - ${r.student.year}</td>
              <td>${new Date(r.recordedAt).toLocaleString()}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

    const { convertToPdf } = require('../services/pdfConverter');
    const buffer = await convertToPdf(html);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${session.name}-attendance.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  },
);

export const download_session_attendance_csv = asyncHandler(
  async (req, res) => {
    const { sessionId } = req.params;

    const session = await EventSessionModel.findOne({
      _id: sessionId,
      organization: req.tenantContext!.organizationId,
    }).populate('event');

    appAssert(session, NOT_FOUND, 'Session not found');

    const records = await AttendanceRecordModel.find({
      session: sessionId,
      organization: req.tenantContext!.organizationId,
    })
      .populate('student', 'firstname lastname course year studentID')
      .sort({ recordedAt: -1 })
      .exec();

    const csvLines = records.map((r: any) => {
      const name = `${r.student.firstname} ${r.student.lastname}`.replace(
        /,/g,
        '',
      );
      const courseYear = `${r.student.course} - ${r.student.year}`;
      const time = new Date(r.recordedAt).toLocaleString().replace(/,/g, '');
      return `${r.student.studentID},${name},${courseYear},${time}`;
    });

    csvLines.unshift('Student ID,Name,Course & Year,Time Recorded');

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `inline; filename="${session.name}-attendance.csv"`,
    });
    res.send(csvLines.join('\n'));
  },
);
