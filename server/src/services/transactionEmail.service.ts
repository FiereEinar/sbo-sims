import { startCase } from 'lodash';
import { format } from 'date-fns';
import { IStudent } from '../models/student.model';
import { ICategory } from '../models/category.model';
import { ITransaction } from '../models/transaction.model';
import { IUser } from '../models/user.model';
import { IOrganization } from '../models/organization.model';
import { resolveStudentEmail } from '../utils/student';
import { WEB_APP_ORIGIN } from '../constants/env';
import {
  sendOrgEmail,
  TransactionReceiptItemInput,
} from './emailService';

export interface SendSingleTransactionReceiptParams {
  transaction: ITransaction;
  student: IStudent;
  category: ICategory;
  recordedBy?: IUser;
  amountPaidNow: number;
  modeOfPayment: string;
  paymentDate: Date;
  /** Decrypted org email credentials – if absent, email is silently skipped */
  orgEmailCredentials?: { user: string; pass: string } | null;
  orgName?: string;
}

export interface SendBatchTransactionReceiptParams {
  transactions: ITransaction[];
  validatedItems: Array<{
    category: ICategory;
    detailsObj: Record<string, any>;
    amount: number;
    isTopUp: boolean;
    existingTransaction?: ITransaction | null;
  }>;
  student: IStudent;
  recordedBy?: IUser;
  modeOfPayment: string;
  paymentDate: Date;
  semester: string;
  schoolYear: string;
  /** Decrypted org email credentials – if absent, email is silently skipped */
  orgEmailCredentials?: { user: string; pass: string } | null;
  orgName?: string;
}

export interface SendUpdateAmountReceiptParams {
  transaction: ITransaction;
  category: ICategory;
  student: IStudent;
  amountAdded: number;
  recordedBy?: IUser;
  organization?: IOrganization;
  /** Decrypted org email credentials – if absent, email is silently skipped */
  orgEmailCredentials?: { user: string; pass: string } | null;
}

/**
 * Sends a real transaction receipt email for a single transaction (creation or top-up).
 * Non-blocking, catches errors safely so transaction creation is never interrupted.
 * Only sends if orgEmailCredentials are provided; otherwise silently skips.
 */
export const notifyStudentTransactionRecorded = async ({
  transaction,
  student,
  category,
  recordedBy,
  amountPaidNow,
  modeOfPayment,
  paymentDate,
  orgEmailCredentials,
  orgName: orgNameOverride,
}: SendSingleTransactionReceiptParams): Promise<void> => {
  try {
    // Silently skip if no org email is configured
    if (!orgEmailCredentials) return;

    const studentEmail = await resolveStudentEmail(student);
    if (!studentEmail) return;

    const studentName = startCase(
      `${student.firstname} ${student.middlename ?? ''} ${student.lastname}`.trim(),
    );

    const org = (category.organization as any) || {};
    const orgName = orgNameOverride || org.name || 'Student Body Organization';
    const governorName = org.governor || transaction.governor || 'Governor';
    const treasurerName = org.treasurer || transaction.treasurer || 'Treasurer';

    const recordedByName = recordedBy
      ? `${recordedBy.firstname} ${recordedBy.lastname}`
      : 'Authorized Officer';

    const receiptNumber = transaction._id.toString().slice(-8).toUpperCase();
    const totalPaid = transaction.amount;
    const balance = Math.max(0, category.fee - totalPaid);
    const status: 'Paid' | 'Partial' =
      totalPaid >= category.fee ? 'Paid' : 'Partial';

    const item: TransactionReceiptItemInput = {
      categoryName: category.name,
      categoryFee: category.fee,
      amountPaidNow,
      totalPaid,
      balance,
      status,
      description: transaction.description,
      details: transaction.details,
    };

    await sendOrgEmail({
      orgEmailUser: orgEmailCredentials.user,
      orgEmailPass: orgEmailCredentials.pass,
      orgName,
      to: studentEmail,
      subject: `Official Receipt #${receiptNumber} — ${orgName}`,
      preheader: `Payment confirmation for ${category.name}.`,
      headerBackground: '#ffffff',
      headerTitle: 'SBO-SIMS',
      headerSubtitle: 'Official Electronic Payment Receipt',
      contentHtml: buildReceiptContentHtml({
        studentName,
        studentID: student.studentID,
        course: student.course,
        year: student.year,
        orgName,
        receiptNumber,
        date: paymentDate,
        modeOfPayment,
        semester: transaction.semester,
        schoolYear: transaction.schoolYear,
        recordedByName,
        treasurerName,
        governorName,
        items: [item],
        totalAmountPaidNow: amountPaidNow,
        totalFee: category.fee,
        totalBalance: balance,
      }),
      footerHtml: buildReceiptFooterHtml(orgName),
    });
  } catch (error) {
    console.error(
      `[Receipt Email] Failed to send receipt for transaction ${transaction._id} to student ${student.studentID}:`,
      error,
    );
  }
};

/**
 * Sends a consolidated transaction receipt email for a batch of transactions recorded at once.
 * Non-blocking, catches errors safely so batch transaction creation is never interrupted.
 * Only sends if orgEmailCredentials are provided; otherwise silently skips.
 */
export const notifyStudentBatchTransactionsRecorded = async ({
  transactions,
  validatedItems,
  student,
  recordedBy,
  modeOfPayment,
  paymentDate,
  semester,
  schoolYear,
  orgEmailCredentials,
  orgName: orgNameOverride,
}: SendBatchTransactionReceiptParams): Promise<void> => {
  try {
    // Silently skip if no org email is configured
    if (!orgEmailCredentials) return;

    const studentEmail = await resolveStudentEmail(student);
    if (!studentEmail) return;

    const studentName = startCase(
      `${student.firstname} ${student.middlename ?? ''} ${student.lastname}`.trim(),
    );

    const firstOrg = (validatedItems[0]?.category?.organization as any) || {};
    const orgName = orgNameOverride || firstOrg.name || 'Student Body Organization';
    const governorName =
      firstOrg.governor || transactions[0]?.governor || 'Governor';
    const treasurerName =
      firstOrg.treasurer || transactions[0]?.treasurer || 'Treasurer';

    const recordedByName = recordedBy
      ? `${recordedBy.firstname} ${recordedBy.lastname}`
      : 'Authorized Officer';

    const receiptNumber =
      transactions[0]?._id?.toString().slice(-8).toUpperCase() ||
      Date.now().toString().slice(-8);

    let totalAmountPaidNow = 0;
    let totalFee = 0;
    let totalBalance = 0;

    const items: TransactionReceiptItemInput[] = validatedItems.map(
      (vItem, idx) => {
        const tx = transactions[idx];
        const numericAmount = Number(vItem.amount);
        const totalPaid = tx
          ? tx.amount
          : vItem.isTopUp && vItem.existingTransaction
            ? vItem.existingTransaction.amount + numericAmount
            : numericAmount;

        const balance = Math.max(0, vItem.category.fee - totalPaid);
        const status: 'Paid' | 'Partial' =
          totalPaid >= vItem.category.fee ? 'Paid' : 'Partial';

        totalAmountPaidNow += numericAmount;
        totalFee += Number(vItem.category.fee);
        totalBalance += balance;

        return {
          categoryName: vItem.category.name,
          categoryFee: vItem.category.fee,
          amountPaidNow: numericAmount,
          totalPaid,
          balance,
          status,
          description: tx?.description,
          details: vItem.detailsObj,
        };
      },
    );

    await sendOrgEmail({
      orgEmailUser: orgEmailCredentials.user,
      orgEmailPass: orgEmailCredentials.pass,
      orgName,
      to: studentEmail,
      subject: `Official Receipt #${receiptNumber} — ${orgName}`,
      preheader: `Payment confirmation for ${items.map((i) => i.categoryName).join(', ')}.`,
      headerBackground: '#ffffff',
      headerTitle: 'SBO-SIMS',
      headerSubtitle: 'Official Electronic Payment Receipt',
      contentHtml: buildReceiptContentHtml({
        studentName,
        studentID: student.studentID,
        course: student.course,
        year: student.year,
        orgName,
        receiptNumber,
        date: paymentDate,
        modeOfPayment,
        semester,
        schoolYear,
        recordedByName,
        treasurerName,
        governorName,
        items,
        totalAmountPaidNow,
        totalFee,
        totalBalance,
      }),
      footerHtml: buildReceiptFooterHtml(orgName),
    });
  } catch (error) {
    console.error(
      `[Receipt Email] Failed to send batch receipt to student ${student.studentID}:`,
      error,
    );
  }
};

/**
 * Sends a transaction receipt email for an amount update (top-up).
 * Non-blocking, catches errors safely.
 * Only sends if orgEmailCredentials are provided; otherwise silently skips.
 */
export const notifyStudentTransactionAmountUpdated = async ({
  transaction,
  category,
  student,
  amountAdded,
  recordedBy,
  organization,
  orgEmailCredentials,
}: SendUpdateAmountReceiptParams): Promise<void> => {
  try {
    // Silently skip if no org email is configured
    if (!orgEmailCredentials) return;

    const studentEmail = await resolveStudentEmail(student);
    if (!studentEmail) return;

    const studentName = startCase(
      `${student.firstname} ${student.middlename ?? ''} ${student.lastname}`.trim(),
    );

    const org = organization || (category.organization as any) || {};
    const orgName = org.name || 'Student Body Organization';
    const governorName = org.governor || transaction.governor || 'Governor';
    const treasurerName = org.treasurer || transaction.treasurer || 'Treasurer';

    const recordedByName = recordedBy
      ? `${recordedBy.firstname} ${recordedBy.lastname}`
      : 'Authorized Officer';

    const receiptNumber = transaction._id.toString().slice(-8).toUpperCase();
    const totalPaid = transaction.amount;
    const balance = Math.max(0, category.fee - totalPaid);
    const status: 'Paid' | 'Partial' =
      totalPaid >= category.fee ? 'Paid' : 'Partial';

    const item: TransactionReceiptItemInput = {
      categoryName: category.name,
      categoryFee: category.fee,
      amountPaidNow: amountAdded,
      totalPaid,
      balance,
      status,
      description: transaction.description,
      details: transaction.details,
    };

    await sendOrgEmail({
      orgEmailUser: orgEmailCredentials.user,
      orgEmailPass: orgEmailCredentials.pass,
      orgName,
      to: studentEmail,
      subject: `Official Receipt #${receiptNumber} — ${orgName}`,
      preheader: `Payment update for ${category.name}.`,
      headerBackground: '#ffffff',
      headerTitle: 'SBO-SIMS',
      headerSubtitle: 'Official Electronic Payment Receipt',
      contentHtml: buildReceiptContentHtml({
        studentName,
        studentID: student.studentID,
        course: student.course,
        year: student.year,
        orgName,
        receiptNumber,
        date: new Date(),
        modeOfPayment: 'cash',
        semester: transaction.semester,
        schoolYear: transaction.schoolYear,
        recordedByName,
        treasurerName,
        governorName,
        items: [item],
        totalAmountPaidNow: amountAdded,
        totalFee: category.fee,
        totalBalance: balance,
      }),
      footerHtml: buildReceiptFooterHtml(orgName),
    });
  } catch (error) {
    console.error(
      `[Receipt Email] Failed to send amount update receipt for transaction ${transaction._id}:`,
      error,
    );
  }
};

// ─── Receipt HTML Builders (extracted to keep service functions readable) ────

interface ReceiptHtmlParams {
  studentName: string;
  studentID: string;
  course?: string;
  year?: number | string;
  orgName: string;
  receiptNumber: string;
  date: Date | string;
  modeOfPayment: string;
  semester: string;
  schoolYear: string;
  recordedByName?: string;
  treasurerName?: string;
  governorName?: string;
  items: TransactionReceiptItemInput[];
  totalAmountPaidNow: number;
  totalFee: number;
  totalBalance: number;
}

function buildReceiptContentHtml(params: ReceiptHtmlParams): string {
  const {
    studentName, studentID, course, year, orgName, receiptNumber, date,
    modeOfPayment, semester, schoolYear, recordedByName, treasurerName,
    governorName, items, totalAmountPaidNow, totalFee, totalBalance,
  } = params;

  const isAllPaid = totalBalance <= 0;
  const statusLabel = isAllPaid ? 'Fully Paid' : 'Partial Payment';
  const statusBadgeBg = isAllPaid ? '#dcfce7' : '#fef3c7';
  const statusBadgeColor = isAllPaid ? '#15803d' : '#b45309';
  const statusBorderColor = isAllPaid ? '#86efac' : '#fde68a';

  const formattedDate = format(new Date(date), 'MMMM dd, yyyy · hh:mm a');
  const termLabel = `${
    semester === '1' ? '1st Semester' : semester === '2' ? '2nd Semester' : `Semester ${semester}`
  }, S.Y. ${schoolYear}`;

  const formatCurrency = (amount: number) =>
    `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const portalUrl = `${WEB_APP_ORIGIN || 'https://sbo-sims.vercel.app'}/#/student/transactions`;

  const itemsRowsHtml = items
    .map((item) => {
      let detailsHtml = '';
      if (item.details && typeof item.details === 'object') {
        const detailEntries = Object.entries(item.details).filter(
          ([_, v]) => v !== undefined && v !== null && String(v).trim().length > 0,
        );
        if (detailEntries.length > 0) {
          detailsHtml = `
            <div style="margin-top:6px;">
              ${detailEntries.map(([key, val]) =>
                `<span style="display:inline-block;background-color:#f1f5f9;color:#475569;border:1px solid #e2e8f0;border-radius:4px;padding:2px 8px;font-size:11px;margin-right:4px;margin-bottom:4px;">
                  <strong>${startCase(key)}:</strong> ${String(val)}
                </span>`,
              ).join('')}
            </div>`;
        }
      }
      const itemBadgeBg = item.status === 'Paid' ? '#e6f4ea' : '#fef3c7';
      const itemBadgeColor = item.status === 'Paid' ? '#137333' : '#b45309';
      return `
        <tr>
          <td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;vertical-align:top;">
            <div style="font-size:14px;font-weight:bold;color:#0f172a;">${item.categoryName}</div>
            ${item.description ? `<div style="font-size:12px;color:#64748b;margin-top:2px;">${item.description}</div>` : ''}
            ${detailsHtml}
          </td>
          <td align="right" style="padding:14px 16px;border-bottom:1px solid #e2e8f0;font-family:monospace;font-size:14px;color:#475569;vertical-align:top;white-space:nowrap;">${formatCurrency(item.categoryFee)}</td>
          <td align="right" style="padding:14px 16px;border-bottom:1px solid #e2e8f0;font-family:monospace;font-size:14px;font-weight:bold;color:#0f172a;vertical-align:top;white-space:nowrap;">${formatCurrency(item.amountPaidNow)}</td>
          <td align="center" style="padding:14px 16px;border-bottom:1px solid #e2e8f0;vertical-align:top;">
            <span style="display:inline-block;background-color:${itemBadgeBg};color:${itemBadgeColor};padding:3px 10px;border-radius:999px;font-size:11px;font-weight:bold;text-transform:uppercase;">${item.status}</span>
          </td>
        </tr>`;
    })
    .join('');

  return `
    <!-- Top Receipt Bar -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;border-bottom:2px solid #0f172a;padding-bottom:16px;">
      <tr>
        <td valign="top">
          <div style="font-size:11px;font-weight:bold;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">${orgName}</div>
          <h2 style="margin:0;font-size:22px;font-weight:bold;color:#0f172a;letter-spacing:-0.3px;">Official Payment Receipt</h2>
          <div style="font-size:13px;color:#64748b;margin-top:4px;">Student Body Organization · Bukidnon State University</div>
        </td>
        <td align="right" valign="top">
          <div style="font-size:11px;font-weight:bold;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">RECEIPT NO.</div>
          <div style="font-family:monospace;font-size:15px;font-weight:bold;color:#0f172a;margin-top:2px;">#${receiptNumber}</div>
          <div style="font-size:12px;color:#64748b;margin-top:4px;">${formattedDate}</div>
        </td>
      </tr>
    </table>
    <!-- Status & Mode Banner -->
    <div style="margin:0 0 24px 0;">
      <span style="display:inline-block;background-color:${statusBadgeBg};color:${statusBadgeColor};border:1px solid ${statusBorderColor};padding:6px 14px;border-radius:999px;font-size:12px;font-weight:bold;letter-spacing:0.5px;text-transform:uppercase;">${statusLabel}</span>
      <span style="display:inline-block;background-color:#f1f5f9;color:#334155;border:1px solid #cbd5e1;padding:6px 12px;border-radius:6px;font-size:12px;font-weight:bold;text-transform:uppercase;margin-left:8px;">Payment Mode: ${modeOfPayment}</span>
    </div>
    <!-- Student / Billed To Section -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;width:50%;"><span style="color:#94a3b8;font-size:11px;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;font-weight:bold;">BILLED TO</span><span style="color:#0f172a;font-size:15px;font-weight:bold;">${studentName}</span></td>
        <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;width:50%;"><span style="color:#94a3b8;font-size:11px;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;font-weight:bold;">STUDENT ID</span><span style="color:#0f172a;font-size:14px;font-weight:bold;font-family:monospace;">${studentID}</span></td>
      </tr>
      <tr>
        <td style="padding:16px 20px;width:50%;"><span style="color:#94a3b8;font-size:11px;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;font-weight:bold;">PROGRAM &amp; YEAR</span><span style="color:#334155;font-size:13px;font-weight:600;">${course ? course.toUpperCase() : 'N/A'}${year ? ` · Year ${year}` : ''}</span></td>
        <td style="padding:16px 20px;width:50%;"><span style="color:#94a3b8;font-size:11px;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;font-weight:bold;">ACADEMIC TERM</span><span style="color:#334155;font-size:13px;font-weight:600;">${termLabel}</span></td>
      </tr>
    </table>
    <!-- Itemized Fee Breakdown Table -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;margin-bottom:20px;">
      <thead bgcolor="#0f172a"><tr bgcolor="#0f172a" style="background-color:#0f172a !important;color:#ffffff !important;"><th align="left" bgcolor="#0f172a" style="background-color:#0f172a !important;color:#ffffff !important;padding:12px 16px;font-size:11px;font-weight:bold;letter-spacing:0.8px;text-transform:uppercase;"><span style="color:#ffffff !important;">Description</span></th><th align="right" bgcolor="#0f172a" style="background-color:#0f172a !important;color:#ffffff !important;padding:12px 16px;font-size:11px;font-weight:bold;letter-spacing:0.8px;text-transform:uppercase;"><span style="color:#ffffff !important;">Fee</span></th><th align="right" bgcolor="#0f172a" style="background-color:#0f172a !important;color:#ffffff !important;padding:12px 16px;font-size:11px;font-weight:bold;letter-spacing:0.8px;text-transform:uppercase;"><span style="color:#ffffff !important;">Paid</span></th><th align="center" bgcolor="#0f172a" style="background-color:#0f172a !important;color:#ffffff !important;padding:12px 16px;font-size:11px;font-weight:bold;letter-spacing:0.8px;text-transform:uppercase;"><span style="color:#ffffff !important;">Status</span></th></tr></thead>
      <tbody>${itemsRowsHtml}</tbody>
    </table>
    <!-- Totals -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
      <tr><td width="40%"></td><td width="60%">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px 0;">
          <tr><td style="padding:8px 18px;font-size:13px;color:#64748b;">Total Fee:</td><td align="right" style="padding:8px 18px;font-family:monospace;font-size:13px;color:#334155;">${formatCurrency(totalFee)}</td></tr>
          <tr><td style="padding:8px 18px;font-size:14px;font-weight:bold;color:#0f172a;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;">Amount Paid (This Txn):</td><td align="right" style="padding:8px 18px;font-family:monospace;font-size:16px;font-weight:bold;color:#0f172a;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;">${formatCurrency(totalAmountPaidNow)}</td></tr>
          ${!isAllPaid ? `<tr><td style="padding:8px 18px;font-size:13px;font-weight:bold;color:#dc2626;">Remaining Balance:</td><td align="right" style="padding:8px 18px;font-family:monospace;font-size:14px;font-weight:bold;color:#dc2626;">${formatCurrency(totalBalance)}</td></tr>` : ''}
        </table>
      </td></tr>
    </table>
    <!-- Signatories -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-top:1px dashed #cbd5e1;padding-top:20px;margin-bottom:24px;">
      <tr>
        <td align="center" style="width:33.33%;padding:10px 8px;"><div style="font-size:13px;font-weight:bold;color:#0f172a;text-transform:uppercase;">${recordedByName || 'Authorized Officer'}</div><div style="border-top:1px solid #94a3b8;margin:6px 16px 4px 16px;"></div><div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Recorded By</div></td>
        <td align="center" style="width:33.33%;padding:10px 8px;"><div style="font-size:13px;font-weight:bold;color:#0f172a;text-transform:uppercase;">${treasurerName || 'Treasurer'}</div><div style="border-top:1px solid #94a3b8;margin:6px 16px 4px 16px;"></div><div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Treasurer</div></td>
        <td align="center" style="width:33.33%;padding:10px 8px;"><div style="font-size:13px;font-weight:bold;color:#0f172a;text-transform:uppercase;">${governorName || 'Governor'}</div><div style="border-top:1px solid #94a3b8;margin:6px 16px 4px 16px;"></div><div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Governor</div></td>
      </tr>
    </table>
    <!-- CTA -->
    <div style="text-align:center;margin:28px 0 10px;">
      <a href="${portalUrl}" style="display:inline-block;background-color:#0f172a;color:#ffffff !important;-webkit-text-fill-color:#ffffff !important;padding:12px 28px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:bold;letter-spacing:0.3px;"><span style="color:#ffffff !important;-webkit-text-fill-color:#ffffff !important;">View in Student Portal</span></a>
    </div>`;
}

function buildReceiptFooterHtml(orgName: string): string {
  return `
    <p style="color:#94a3b8;font-size:12px;margin:0 0 6px;line-height:1.5;">
      This electronic receipt is officially generated by SBO-SIMS for ${orgName}.<br>
      Bukidnon State University · Please retain this email for your financial clearance and personal records.
    </p>
    <p style="color:#cbd5e1;font-size:11px;margin:0;">Do not reply directly to this automated email.</p>`;
}

