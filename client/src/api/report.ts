import axiosInstance from './axiosInstance';
import { APIResponse } from '@/types/api-response';

export type MonthlyStat = {
	month: string;
	totalAmount: number;
	count: number;
};

export type CategoryBreakdown = {
	name: string;
	fee: number;
	totalCollected: number;
	totalTransactions: number;
	collectionRate: number;
	expectedRevenue: number;
};

export type MopBreakdown = {
	mode: string;
	total: number;
	count: number;
};

export type TopStudent = {
	studentID: string;
	name: string;
	course: string;
	totalPaid: number;
	txCount: number;
};

export type ReportSummary = {
	totalRevenue: number;
	totalTransactions: number;
	totalStudents: number;
	monthly: MonthlyStat[];
	categoryBreakdown: CategoryBreakdown[];
	modeOfPayment: MopBreakdown[];
	topStudents: TopStudent[];
	meta: { semester: string; schoolYear: string };
};

export type MonthlyReport = {
	month: string;
	totalAmount: number;
	count: number;
};

export const fetchReportSummary = async (): Promise<ReportSummary> => {
	const { data } = await axiosInstance.get<APIResponse<ReportSummary>>('/report/summary');
	return data.data;
};

export const fetchMonthlyReport = async (): Promise<MonthlyReport[]> => {
	const { data } = await axiosInstance.get<APIResponse<MonthlyReport[]>>('/report/monthly');
	return data.data;
};

export const getReportDownloadPdfURL = (): string => {
	return `${import.meta.env.VITE_API_URL}/report/download/pdf`;
};
