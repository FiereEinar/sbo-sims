import asyncHandler from 'express-async-handler';
import CustomResponse from '../types/response';
import EventModel from '../models/event.model';
import EventSessionModel from '../models/event-session.model';
import AttendanceRecordModel from '../models/attendance-record.model';

export const get_attendance_summary = asyncHandler(async (req, res) => {
  const { organizationId, semester, schoolYear } = req.tenantContext!;

  // 1. Fetch all events for this tenant context
  const events = await EventModel.find({
    organization: organizationId,
    semester,
    schoolYear,
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
    eventAttendanceAgg
      .filter((agg) => agg._id != null)
      .map((agg) => [agg._id.toString(), agg.count]),
  );

  const eventsBreakdown = events.map((ev) => {
    const evSessions = sessions.filter(
      (s) => s.event && s.event.toString() === ev._id.toString(),
    );
    return {
      eventId: ev._id,
      title: ev.title,
      date: ev.start,
      totalSessions: evSessions.length,
      totalScans: eventAttendanceMap.get(ev._id.toString()) || 0,
    };
  });

  // 5. Compute top students by attendance using studentIdInput -> Student matching
  const topStudentsAgg = await AttendanceRecordModel.aggregate([
    {
      $match: {
        organization: organizationId,
        session: { $in: sessionIds },
      },
    },
    {
      $lookup: {
        from: 'students',
        let: { scannedId: '$studentIdInput', orgId: '$organization' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$studentID', '$$scannedId'] },
                  { $eq: ['$organization', '$$orgId'] },
                ],
              },
            },
          },
          { $sort: { updatedAt: -1 } },
          { $limit: 1 },
        ],
        as: 'studentDoc',
      },
    },
    { $unwind: { path: '$studentDoc', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: {
          $ifNull: ['$studentDoc._id', '$studentIdInput'],
        },
        studentID: {
          $first: { $ifNull: ['$studentDoc.studentID', '$studentIdInput'] },
        },
        firstname: { $first: '$studentDoc.firstname' },
        lastname: { $first: '$studentDoc.lastname' },
        course: { $first: '$studentDoc.course' },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  const topStudents = topStudentsAgg.map((agg) => ({
    studentID: agg.studentID || 'Unknown',
    name:
      agg.firstname && agg.lastname
        ? `${agg.firstname} ${agg.lastname}`
        : agg.studentID
          ? `Unmapped (${agg.studentID})`
          : 'Unmapped',
    course: agg.course || '-',
    attendedCount: agg.count,
  }));

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
      'Attendance report summary',
    ),
  );
});
