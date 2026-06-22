import asyncHandler from 'express-async-handler';
import CustomResponse from '../types/response';
import EventModel from '../models/event.model';
import EventSessionModel from '../models/event-session.model';
import AttendanceRecordModel from '../models/attendance-record.model';
import StudentModel from '../models/student.model';

export const get_attendance_summary = asyncHandler(async (req, res) => {
  const { organizationId, semester, schoolYear } = req.tenantContext!;

  // 1. Fetch all events
  const events = await EventModel.find({
    organization: organizationId,
    archived: false,
  }).lean();

  const eventIds = events.map((e) => e._id);
  const totalEvents = events.length;

  // 2. Fetch all sessions for these events
  const sessions = await EventSessionModel.find({
    organization: organizationId,
    event: { $in: eventIds },
  }).lean();

  const sessionIds = sessions.map((s) => s._id);
  const totalSessions = sessions.length;

  // 3. Count total attendance records
  const totalAttendances = await AttendanceRecordModel.countDocuments({
    organization: organizationId,
    session: { $in: sessionIds },
  });

  // 4. Compute events breakdown
  const eventAttendanceAgg = await AttendanceRecordModel.aggregate([
    {
      $match: {
        organization: organizationId,
        session: { $in: sessionIds },
      },
    },
    {
      $group: {
        _id: '$event',
        count: { $sum: 1 },
      },
    },
  ]);

  const eventAttendanceMap = new Map(
    eventAttendanceAgg.map((agg) => [agg._id.toString(), agg.count])
  );

  const eventsBreakdown = events.map((ev) => {
    const evSessions = sessions.filter(
      (s) => s.event.toString() === ev._id.toString()
    );
    return {
      eventId: ev._id,
      title: ev.title,
      date: ev.start,
      totalSessions: evSessions.length,
      totalScans: eventAttendanceMap.get(ev._id.toString()) || 0,
    };
  });

  // 5. Compute top students by attendance
  const topStudentsAgg = await AttendanceRecordModel.aggregate([
    {
      $match: {
        organization: organizationId,
        session: { $in: sessionIds },
      },
    },
    {
      $group: {
        _id: '$student',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  const topStudentIds = topStudentsAgg.map((agg) => agg._id);
  const students = await StudentModel.find({ _id: { $in: topStudentIds } })
    .select('_id studentID firstname lastname course')
    .lean();

  const studentMap = new Map(students.map((s) => [s._id.toString(), s]));

  const topStudents = topStudentsAgg.map((agg) => {
    const s = studentMap.get(agg._id.toString());
    return {
      studentID: s?.studentID || 'Unknown',
      name: s ? `${s.firstname} ${s.lastname}` : 'Unknown',
      course: s?.course || 'Unknown',
      attendedCount: agg.count,
    };
  });

  res.json(
    new CustomResponse(
      true,
      {
        totalEvents,
        totalSessions,
        totalAttendances,
        eventsBreakdown,
        topStudents,
        meta: { semester, schoolYear },
      },
      'Attendance report summary'
    )
  );
});
