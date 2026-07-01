import asyncHandler from 'express-async-handler';
import appAssert from '../errors/appAssert';
import { BAD_REQUEST, CONFLICT, NOT_FOUND } from '../constants/http';
import AttendanceRecordModel from '../models/attendance-record.model';
import EventSessionModel from '../models/event-session.model';
import StudentModel from '../models/student.model';
import mongoose from 'mongoose';
import CustomResponse, { CustomPaginatedResponse } from '../types/response';
import {
  RecordAttendanceBody,
  recordAttendanceSchema,
} from '../middlewares/validations/attendance.validation';
import { escapeRegex } from '../utils/utils';

// Helper to safely narrow Express query/param values to string
const toStr = (v: unknown): string | undefined =>
  typeof v === 'string' ? v : undefined;

// ── Shared Aggregation Builder ──────────────────────────────────────────────

interface AttendanceAggregationOptions {
  sessionId: string;
  organizationId: string;
  course?: string;
  year?: string;
  gender?: string;
  search?: string;
  sortBy?: 'asc' | 'desc';
  skip?: number;
  limit?: number;
  countOnly?: boolean;
}

/**
 * Builds a MongoDB aggregation pipeline for attendance records, joining
 * with student data and applying optional filters.
 */
async function buildAttendanceAggregation(
  options: AttendanceAggregationOptions,
) {
  const {
    sessionId,
    organizationId,
    course,
    year,
    gender,
    search,
    sortBy = 'desc',
    skip,
    limit,
    countOnly = false,
  } = options;

  const pipeline: mongoose.PipelineStage[] = [
    // 1. Match attendance records for this session & org
    {
      $match: {
        session: new mongoose.Types.ObjectId(sessionId),
        organization: new mongoose.Types.ObjectId(organizationId),
      },
    },
    // 2. Join the student document
    {
      $lookup: {
        from: 'students',
        localField: 'student',
        foreignField: '_id',
        as: 'student',
      },
    },
    // 3. Unwind (student is always one)
    { $unwind: '$student' },
  ];

  // 4. Build student-field filters
  const studentFilters: Record<string, any>[] = [];
  if (course && course !== 'All') studentFilters.push({ 'student.course': course });
  if (year && year !== 'All') studentFilters.push({ 'student.year': parseInt(year) });
  if (gender && gender !== 'All') studentFilters.push({ 'student.gender': gender });
  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    studentFilters.push({
      $or: [
        { 'student.studentID': { $regex: re } },
        { 'student.firstname': { $regex: re } },
        { 'student.lastname': { $regex: re } },
      ],
    });
  }

  if (studentFilters.length > 0) {
    pipeline.push({ $match: { $and: studentFilters } });
  }

  if (countOnly) {
    pipeline.push({ $count: 'total' });
    return AttendanceRecordModel.aggregate(pipeline);
  }

  // 5. Sort by recordedAt
  pipeline.push({ $sort: { recordedAt: sortBy === 'asc' ? 1 : -1 } });

  // 6. Pagination
  if (skip !== undefined) pipeline.push({ $skip: skip });
  if (limit !== undefined) pipeline.push({ $limit: limit });

  return AttendanceRecordModel.aggregate(pipeline);
}

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
    semester: req.tenantContext!.semester,
    schoolYear: req.tenantContext!.schoolYear,
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
 * GET - Read All Attendance Records for a Session (with filters)
 */
export const get_session_attendance = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { page, pageSize, search, course, year, gender, sortBy } = req.query;

  appAssert(sessionId, BAD_REQUEST, 'Session ID parameter is required');

  const pageNum = page ? parseInt(page as string) : 1;
  const pageSizeNum = pageSize ? parseInt(pageSize as string) : 50;
  const skipAmount = (pageNum - 1) * pageSizeNum;

  const orgId = req.tenantContext!.organizationId.toString();

  const [records, countResult] = await Promise.all([
    buildAttendanceAggregation({
      sessionId: toStr(sessionId)!,
      organizationId: orgId,
      search: toStr(search),
      course: toStr(course),
      year: toStr(year),
      gender: toStr(gender),
      sortBy: (toStr(sortBy) as 'asc' | 'desc') || 'desc',
      skip: skipAmount,
      limit: pageSizeNum,
    }),
    buildAttendanceAggregation({
      sessionId: toStr(sessionId)!,
      organizationId: orgId,
      search: toStr(search),
      course: toStr(course),
      year: toStr(year),
      gender: toStr(gender),
      countOnly: true,
    }),
  ]);

  const totalCount = (countResult as any[])[0]?.total ?? 0;
  const nextPage = totalCount > skipAmount + pageSizeNum ? pageNum + 1 : -1;
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

/**
 * GET - Download Attendance Records as PDF
 */
export const download_session_attendance_pdf = asyncHandler(
  async (req, res) => {
    const { sessionId } = req.params;
    const { search, course, year, gender, sortBy } = req.query;

    const session = await EventSessionModel.findOne({
      _id: sessionId,
      organization: req.tenantContext!.organizationId,
    }).populate('event');

    appAssert(session, NOT_FOUND, 'Session not found');

    const records = await buildAttendanceAggregation({
      sessionId: toStr(sessionId)!,
      organizationId: req.tenantContext!.organizationId.toString(),
      search: toStr(search),
      course: toStr(course),
      year: toStr(year),
      gender: toStr(gender),
      sortBy: (toStr(sortBy) as 'asc' | 'desc') || 'desc',
    });

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
            <th>Course</th>
            <th>Year</th>
            <th>Gender</th>
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
              <td>${r.student.course}</td>
              <td>${r.student.year}</td>
              <td>${r.student.gender}</td>
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

/**
 * GET - Download Attendance Records as CSV
 */
export const download_session_attendance_csv = asyncHandler(
  async (req, res) => {
    const { sessionId } = req.params;
    const { search, course, year, gender, sortBy } = req.query;

    const session = await EventSessionModel.findOne({
      _id: sessionId,
      organization: req.tenantContext!.organizationId,
    }).populate('event');

    appAssert(session, NOT_FOUND, 'Session not found');

    const records = await buildAttendanceAggregation({
      sessionId: toStr(sessionId)!,
      organizationId: req.tenantContext!.organizationId.toString(),
      search: toStr(search),
      course: toStr(course),
      year: toStr(year),
      gender: toStr(gender),
      sortBy: (toStr(sortBy) as 'asc' | 'desc') || 'desc',
    });

    const csvLines = records.map((r: any) => {
      const name = `${r.student.firstname} ${r.student.lastname}`.replace(
        /,/g,
        '',
      );
      const time = new Date(r.recordedAt).toLocaleString().replace(/,/g, '');
      return `${r.student.studentID},${name},${r.student.course},${r.student.year},${r.student.gender},${time}`;
    });

    csvLines.unshift('Student ID,Name,Course,Year,Gender,Time Recorded');

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `inline; filename="${session.name}-attendance.csv"`,
    });
    res.send(csvLines.join('\n'));
  },
);
