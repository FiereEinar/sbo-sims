import asyncHandler from 'express-async-handler';
import ejs from 'ejs';
import path from 'path';
import fs from 'fs/promises';
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';
import CustomResponse from '../types/response';
import { convertToPdf } from '../services/pdfConverter';
import { ICategory } from '../models/category';

// ── helpers ─────────────────────────────────────────────────────────────────

const MONTHS = [
	'January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December',
];

// ── GET /report/summary ──────────────────────────────────────────────────────
/**
 * Returns a full report summary for the active sem/school year:
 * - overall totals
 * - monthly breakdown (last 12 months)
 * - per-category breakdown
 * - collection rate per category
 * - top 10 paying students
 * - mode of payment distribution
 */
export const get_summary_report = asyncHandler(async (req, res) => {
	const { organizationId, semester, schoolYear } = req.tenantContext!;

	// ── Overall totals ───────────────────────────────────────────────────────
	const overallAgg = await req.TransactionModel.aggregate([
		{
			$match: {
				organization: organizationId,
				semester,
				schoolYear,
			},
		},
		{
			$group: {
				_id: null,
				totalRevenue: { $sum: '$amount' },
				totalTransactions: { $sum: 1 },
			},
		},
	]);

	const totalRevenue = overallAgg[0]?.totalRevenue ?? 0;
	const totalTransactions = overallAgg[0]?.totalTransactions ?? 0;

	// ── Monthly breakdown ────────────────────────────────────────────────────
	const monthlyAgg = await req.TransactionModel.aggregate([
		{
			$match: {
				organization: organizationId,
				semester,
				schoolYear,
			},
		},
		{
			$group: {
				_id: { $month: { $toDate: '$date' } },
				totalAmount: { $sum: '$amount' },
				count: { $sum: 1 },
			},
		},
		{ $sort: { _id: 1 } },
	]);

	const monthly = monthlyAgg.map((m) => ({
		month: MONTHS[(m._id as number) - 1],
		monthIndex: m._id,
		totalAmount: m.totalAmount,
		count: m.count,
	}));

	// ── Per-category breakdown ───────────────────────────────────────────────
	const categories = await req.CategoryModel.find({
		organization: organizationId,
		semester,
		schoolYear,
	}).lean();

	const totalStudents = await req.StudentModel.countDocuments({
		organization: organizationId,
		semester,
		schoolYear,
	});

	const categoryStats = await req.TransactionModel.aggregate([
		{
			$match: {
				organization: organizationId,
				semester,
				schoolYear,
			},
		},
		{
			$group: {
				_id: '$category',
				totalAmount: { $sum: '$amount' },
				count: { $sum: 1 },
			},
		},
	]);

	const statsMap = new Map(
		categoryStats.map((s) => [s._id.toString(), s])
	);

	const categoryBreakdown = categories.map((cat) => {
		const stats = statsMap.get(cat._id.toString()) ?? { totalAmount: 0, count: 0 };
		const expectedRevenue = cat.fee * totalStudents;
		const collectionRate =
			expectedRevenue > 0
				? Math.min(100, (stats.totalAmount / expectedRevenue) * 100)
				: 0;
		return {
			name: cat.name,
			fee: cat.fee,
			totalCollected: stats.totalAmount,
			totalTransactions: stats.count,
			collectionRate: parseFloat(collectionRate.toFixed(1)),
			expectedRevenue,
		};
	});

	// ── Mode of payment ──────────────────────────────────────────────────────
	const mopAgg = await req.TransactionModel.aggregate([
		{
			$match: {
				organization: organizationId,
				semester,
				schoolYear,
			},
		},
		{
			$group: {
				_id: '$modeOfPayment',
				total: { $sum: '$amount' },
				count: { $sum: 1 },
			},
		},
	]);

	const modeOfPayment = mopAgg.map((m) => ({
		mode: m._id,
		total: m.total,
		count: m.count,
	}));

	// ── Top 10 paying students ───────────────────────────────────────────────
	const topStudentsAgg = await req.TransactionModel.aggregate([
		{
			$match: {
				organization: organizationId,
				semester,
				schoolYear,
			},
		},
		{
			$group: {
				_id: '$owner',
				totalPaid: { $sum: '$amount' },
				txCount: { $sum: 1 },
			},
		},
		{ $sort: { totalPaid: -1 } },
		{ $limit: 10 },
	]);

	const ownerIds = topStudentsAgg.map((s) => s._id);
	const studentDocs = await req.StudentModel.find({ _id: { $in: ownerIds } }).lean();
	const studentMap = new Map(studentDocs.map((s) => [s._id.toString(), s]));

	const topStudents = topStudentsAgg.map((s) => {
		const student = studentMap.get(s._id.toString());
		return {
			studentID: student?.studentID ?? 'N/A',
			name: student
				? `${student.firstname} ${student.lastname}`
				: 'Unknown',
			course: student?.course ?? 'N/A',
			totalPaid: s.totalPaid,
			txCount: s.txCount,
		};
	});

	res.json(
		new CustomResponse(
			true,
			{
				totalRevenue,
				totalTransactions,
				totalStudents,
				monthly,
				categoryBreakdown,
				modeOfPayment,
				topStudents,
				meta: { semester, schoolYear },
			},
			'Report summary'
		)
	);
});

// ── GET /report/monthly ──────────────────────────────────────────────────────
/**
 * Returns last 12 rolling months of data regardless of current sem filter
 */
export const get_monthly_report = asyncHandler(async (req, res) => {
	const { organizationId } = req.tenantContext!;

	const now = new Date();
	const months = Array.from({ length: 12 }, (_, i) => subMonths(now, i)).reverse();

	const monthlyData = await Promise.all(
		months.map(async (monthDate) => {
			const start = startOfMonth(monthDate);
			const end = endOfMonth(monthDate);

			const agg = await req.TransactionModel.aggregate([
				{
					$match: {
						organization: organizationId,
						date: { $gte: start.toISOString(), $lte: end.toISOString() },
					},
				},
				{
					$group: {
						_id: null,
						totalAmount: { $sum: '$amount' },
						count: { $sum: 1 },
					},
				},
			]);

			return {
				month: format(monthDate, 'MMMM yyyy'),
				totalAmount: agg[0]?.totalAmount ?? 0,
				count: agg[0]?.count ?? 0,
			};
		})
	);

	res.json(new CustomResponse(true, monthlyData, 'Monthly report (last 12 months)'));
});

// ── GET /report/download/pdf ─────────────────────────────────────────────────
/**
 * Generates and streams a PDF of the full summary report
 */
export const download_report_pdf = asyncHandler(async (req, res) => {
	const { organizationId, semester, schoolYear } = req.tenantContext!;

	// Fetch org info
	const org = await req.OrganizationModel.findById(organizationId).lean();

	// Fetch categories
	const categories = await req.CategoryModel.find({
		organization: organizationId,
		semester,
		schoolYear,
	}).lean();

	// Overall totals
	const overallAgg = await req.TransactionModel.aggregate([
		{ $match: { organization: organizationId, semester, schoolYear } },
		{ $group: { _id: null, totalRevenue: { $sum: '$amount' }, totalTransactions: { $sum: 1 } } },
	]);
	const totalRevenue = overallAgg[0]?.totalRevenue ?? 0;
	const totalTransactions = overallAgg[0]?.totalTransactions ?? 0;
	const totalStudents = await req.StudentModel.countDocuments({
		organization: organizationId,
		semester,
		schoolYear,
	});

	// Monthly breakdown
	const monthlyAgg = await req.TransactionModel.aggregate([
		{ $match: { organization: organizationId, semester, schoolYear } },
		{
			$group: {
				_id: { $month: { $toDate: '$date' } },
				totalAmount: { $sum: '$amount' },
				count: { $sum: 1 },
			},
		},
		{ $sort: { _id: 1 } },
	]);
	const monthly = monthlyAgg.map((m) => ({
		month: MONTHS[(m._id as number) - 1],
		totalAmount: m.totalAmount,
		count: m.count,
	}));

	// Per-category breakdown
	const categoryStats = await req.TransactionModel.aggregate([
		{ $match: { organization: organizationId, semester, schoolYear } },
		{
			$group: {
				_id: '$category',
				totalAmount: { $sum: '$amount' },
				count: { $sum: 1 },
			},
		},
	]);
	const statsMap = new Map(categoryStats.map((s) => [s._id.toString(), s]));
	const categoryBreakdown = categories.map((cat) => {
		const stats = statsMap.get(cat._id.toString()) ?? { totalAmount: 0, count: 0 };
		const expectedRevenue = cat.fee * totalStudents;
		const collectionRate = expectedRevenue > 0
			? Math.min(100, (stats.totalAmount / expectedRevenue) * 100)
			: 0;
		return {
			name: cat.name,
			fee: cat.fee,
			totalCollected: stats.totalAmount,
			totalTransactions: stats.count,
			collectionRate: collectionRate.toFixed(1),
			expectedRevenue,
		};
	});

	// Mode of payment
	const mopAgg = await req.TransactionModel.aggregate([
		{ $match: { organization: organizationId, semester, schoolYear } },
		{ $group: { _id: '$modeOfPayment', total: { $sum: '$amount' }, count: { $sum: 1 } } },
	]);

	const generatedAt = format(new Date(), 'MMMM dd, yyyy, hh:mm a');

	const html = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8" />
	<style>
		* { box-sizing: border-box; margin: 0; padding: 0; }
		body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #1a1a1a; padding: 40px; background: #fff; }
		.header { border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
		.header h1 { font-size: 24px; font-weight: 700; color: #4f46e5; }
		.header p { color: #6b7280; font-size: 11px; margin-top: 4px; }
		.meta { display: flex; gap: 20px; margin-bottom: 30px; }
		.meta-item { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 18px; flex: 1; }
		.meta-item .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin-bottom: 4px; }
		.meta-item .value { font-size: 20px; font-weight: 700; color: #1a1a1a; }
		.section { margin-bottom: 30px; }
		.section h2 { font-size: 14px; font-weight: 700; color: #374151; border-left: 4px solid #4f46e5; padding-left: 10px; margin-bottom: 14px; }
		table { width: 100%; border-collapse: collapse; font-size: 11px; }
		th { background: #f3f4f6; text-align: left; padding: 8px 10px; font-weight: 600; color: #6b7280; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; border-bottom: 2px solid #e5e7eb; }
		td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; }
		tr:nth-child(even) td { background: #fafafa; }
		.badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 600; }
		.badge-green { background: #d1fae5; color: #065f46; }
		.badge-yellow { background: #fef3c7; color: #92400e; }
		.badge-red { background: #fee2e2; color: #991b1b; }
		.footer { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 14px; font-size: 10px; color: #9ca3af; text-align: center; }
		.rate-bar { background: #e5e7eb; border-radius: 4px; height: 8px; width: 100%; overflow: hidden; }
		.rate-fill { background: #4f46e5; height: 8px; border-radius: 4px; }
	</style>
</head>
<body>
	<div class="header">
		<h1>${org?.name ?? 'Organization'} — Financial Report</h1>
		<p>School Year: ${schoolYear} &nbsp;|&nbsp; Semester: ${semester} &nbsp;|&nbsp; Generated: ${generatedAt}</p>
	</div>

	<div class="meta">
		<div class="meta-item">
			<div class="label">Total Collections</div>
			<div class="value">&#8369;${totalRevenue.toLocaleString()}</div>
		</div>
		<div class="meta-item">
			<div class="label">Total Transactions</div>
			<div class="value">${totalTransactions.toLocaleString()}</div>
		</div>
		<div class="meta-item">
			<div class="label">Total Students</div>
			<div class="value">${totalStudents.toLocaleString()}</div>
		</div>
	</div>

	<div class="section">
		<h2>Monthly Collections Breakdown</h2>
		<table>
			<thead>
				<tr>
					<th>Month</th>
					<th>Transactions</th>
					<th>Amount Collected</th>
				</tr>
			</thead>
			<tbody>
				${monthly.length > 0 ? monthly.map((m) => `
					<tr>
						<td>${m.month}</td>
						<td>${m.count}</td>
						<td>&#8369;${m.totalAmount.toLocaleString()}</td>
					</tr>
				`).join('') : '<tr><td colspan="3" style="color:#9ca3af;font-style:italic">No data for this period</td></tr>'}
			</tbody>
		</table>
	</div>

	<div class="section">
		<h2>Category Performance</h2>
		<table>
			<thead>
				<tr>
					<th>Category</th>
					<th>Fee</th>
					<th>Collected</th>
					<th>Expected</th>
					<th>Transactions</th>
					<th>Collection Rate</th>
					<th>Status</th>
				</tr>
			</thead>
			<tbody>
				${categoryBreakdown.length > 0 ? categoryBreakdown.map((c) => {
					const rate = parseFloat(c.collectionRate);
					const badgeClass = rate >= 80 ? 'badge-green' : rate >= 50 ? 'badge-yellow' : 'badge-red';
					const badgeLabel = rate >= 80 ? 'Good' : rate >= 50 ? 'Fair' : 'Low';
					return `
					<tr>
						<td><strong>${c.name}</strong></td>
						<td>&#8369;${c.fee.toLocaleString()}</td>
						<td>&#8369;${c.totalCollected.toLocaleString()}</td>
						<td>&#8369;${c.expectedRevenue.toLocaleString()}</td>
						<td>${c.totalTransactions}</td>
						<td>
							<div style="display:flex;align-items:center;gap:6px;">
								<div class="rate-bar" style="width:70px">
									<div class="rate-fill" style="width:${Math.min(100, rate)}%"></div>
								</div>
								${rate}%
							</div>
						</td>
						<td><span class="badge ${badgeClass}">${badgeLabel}</span></td>
					</tr>`;
				}).join('') : '<tr><td colspan="7" style="color:#9ca3af;font-style:italic">No categories found</td></tr>'}
			</tbody>
		</table>
	</div>

	<div class="section">
		<h2>Mode of Payment Breakdown</h2>
		<table>
			<thead>
				<tr>
					<th>Mode</th>
					<th>Transactions</th>
					<th>Total Amount</th>
				</tr>
			</thead>
			<tbody>
				${mopAgg.length > 0 ? mopAgg.map((m) => `
					<tr>
						<td style="text-transform:capitalize">${m._id}</td>
						<td>${m.count}</td>
						<td>&#8369;${m.total.toLocaleString()}</td>
					</tr>
				`).join('') : '<tr><td colspan="3" style="color:#9ca3af;font-style:italic">No data</td></tr>'}
			</tbody>
		</table>
	</div>

	<div class="footer">
		This report was automatically generated by SBO SIMS &nbsp;|&nbsp; Confidential &nbsp;|&nbsp; ${generatedAt}
	</div>
</body>
</html>`;

	const buffer = await convertToPdf(html);

	const filename = `report_SY${schoolYear}_SEM${semester}_${format(new Date(), 'yyyyMMdd')}.pdf`;

	res.set({
		'Content-Type': 'application/pdf',
		'Content-Disposition': `attachment; filename="${filename}"`,
		'Content-Length': buffer.length,
	});
	res.end(buffer);
});
