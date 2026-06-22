import axiosInstance from './axiosInstance';

export interface EventAttendanceBreakdown {
  eventId: string;
  title: string;
  date: string;
  totalSessions: number;
  totalScans: number;
}

export interface TopAttendingStudent {
  studentID: string;
  name: string;
  course: string;
  attendedCount: number;
}

export interface AttendanceReportSummaryResponse {
  success: boolean;
  message: string;
  data: {
    totalEvents: number;
    totalSessions: number;
    totalAttendances: number;
    eventsBreakdown: EventAttendanceBreakdown[];
    topStudents: TopAttendingStudent[];
    meta: {
      semester: string;
      schoolYear: number;
    };
  };
}

export const fetchAttendanceReportSummary = async (): Promise<
  AttendanceReportSummaryResponse['data']
> => {
  const { data } = await axiosInstance.get<AttendanceReportSummaryResponse>(
    '/attendance-report/summary'
  );
  return data.data;
};
