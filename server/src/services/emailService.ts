import nodemailer from 'nodemailer';
import { format } from 'date-fns';
import { startCase } from 'lodash';
import { EMAIL_USER, EMAIL_PASS, WEB_APP_ORIGIN } from '../constants/env';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

/**
 * Creates a nodemailer transporter configured with an org's own Gmail credentials.
 */
export const createOrgTransporter = (emailUser: string, emailPass: string) =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: { user: emailUser, pass: emailPass },
  });


// ─── Shared Email Layout & Sending ──────────────────────────────────────────

export interface EmailLayoutOptions {
  preheader?: string;
  headerTitle?: string;
  headerSubtitle?: string;
  headerBackground?: string;
  contentHtml: string;
  footerHtml?: string;
}

/**
 * Renders a standardized, responsive HTML email shell used across all SBO-SIMS emails.
 */
export const renderEmailLayout = ({
  preheader,
  headerTitle = 'SBO-SIMS',
  headerSubtitle = 'Student Organization Management System',
  headerBackground = '#1a73e8',
  contentHtml,
  footerHtml,
}: EmailLayoutOptions): string => {
  const defaultFooter = `
    <p style="color:#9aa0a6;font-size:12px;margin:0;line-height:1.5;">
      This is an automated notification from SBO-SIMS.<br>
      Please do not reply directly to this email.
    </p>
  `;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${headerTitle}</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
      ${
        preheader
          ? `<span style="display:none;font-size:1px;color:#f4f4f4;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>`
          : ''
      }
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f4f4f4;padding:24px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">
              <!-- Header -->
              <tr>
                <td style="background:${headerBackground};padding:30px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:bold;letter-spacing:0.5px;">${headerTitle}</h1>
                  ${
                    headerSubtitle
                      ? `<p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">${headerSubtitle}</p>`
                      : ''
                  }
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:36px 30px;">
                  ${contentHtml}
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color:#f8f9fa;padding:20px 30px;border-top:1px solid #e0e0e0;text-align:center;">
                  ${footerHtml || defaultFooter}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export interface SendSystemEmailOptions extends EmailLayoutOptions {
  to: string;
  subject: string;
}

/**
 * Helper to dispatch emails with standard SBO-SIMS headers and responsive layout.
 */
export const sendSystemEmail = async (options: SendSystemEmailOptions) => {
  const html = renderEmailLayout(options);

  const mailOptions = {
    from: `"SBO-SIMS" <${EMAIL_USER}>`,
    replyTo: EMAIL_USER,
    to: options.to,
    subject: options.subject,
    headers: {
      'X-Mailer': 'SBO-SIMS Mailer',
      'X-Priority': '3',
      Precedence: 'bulk',
      'List-Unsubscribe': `<mailto:${EMAIL_USER}?subject=unsubscribe>`,
    },
    html,
  };

  return await transporter.sendMail(mailOptions);
};

export interface SendOrgEmailOptions extends EmailLayoutOptions {
  to: string;
  subject: string;
  orgEmailUser: string;
  orgEmailPass: string;
  orgName?: string;
}

/**
 * Sends an email using the organization's own Gmail credentials.
 * Falls back to sendSystemEmail if org credentials are not provided.
 */
export const sendOrgEmail = async (options: SendOrgEmailOptions) => {
  const html = renderEmailLayout(options);
  const fromName = options.orgName ? `"${options.orgName} via SBO-SIMS"` : '"SBO-SIMS"';

  const mailOptions = {
    from: `${fromName} <${options.orgEmailUser}>`,
    replyTo: options.orgEmailUser,
    to: options.to,
    subject: options.subject,
    headers: {
      'X-Mailer': 'SBO-SIMS Mailer',
      'X-Priority': '3',
      Precedence: 'bulk',
      'List-Unsubscribe': `<mailto:${options.orgEmailUser}?subject=unsubscribe>`,
    },
    html,
  };

  const orgTransporter = createOrgTransporter(options.orgEmailUser, options.orgEmailPass);
  return await orgTransporter.sendMail(mailOptions);
};


// ─── Existing System Emails (Refactored to reuse base layout) ────────────────

/**
 * Sends a verification email to a newly registered user.
 */
export const sendVerificationEmail = async (
  to: string,
  verificationUrl: string,
) => {
  const contentHtml = `
    <h2 style="color:#202124;font-size:20px;margin:0 0 16px;">Verify Your Email Address</h2>
    <p style="color:#5f6368;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Welcome to SBO-SIMS! To activate your account and get started, please verify your email address by clicking the button below.
      This link will expire in <strong>24 hours</strong>.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${verificationUrl}" style="display:inline-block;background-color:#1a73e8;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:6px;font-size:16px;font-weight:bold;">Verify Email</a>
    </div>
    <p style="color:#5f6368;font-size:13px;line-height:1.6;margin:24px 0 0;">
      If the button above doesn't work, copy and paste this link into your browser:<br>
      <a href="${verificationUrl}" style="color:#1a73e8;word-break:break-all;">${verificationUrl}</a>
    </p>
  `;

  const footerHtml = `
    <p style="color:#9aa0a6;font-size:12px;margin:0;line-height:1.5;">
      You received this email because someone registered an account using this address on SBO-SIMS.<br>
      If this wasn't you, you can safely ignore this email.
    </p>
  `;

  await sendSystemEmail({
    to,
    subject: 'Verify your SBO-SIMS Account',
    preheader: 'Verify your SBO-SIMS account to get started.',
    headerBackground: '#1a73e8',
    headerTitle: 'SBO-SIMS',
    headerSubtitle: 'Student Organization Management System',
    contentHtml,
    footerHtml,
  });
};

/**
 * Sends a payment request status notification email to the student.
 */
export const sendPaymentRequestStatusEmail = async (
  to: string,
  studentName: string,
  categoryName: string,
  orgName: string,
  amount: number,
  status: 'approved' | 'rejected',
  remarks?: string,
) => {
  const isApproved = status === 'approved';
  const statusLabel = isApproved ? 'Approved' : 'Rejected';
  const headerColor = isApproved ? '#1e8e3e' : '#d93025';
  const badgeBg = isApproved ? '#e6f4ea' : '#fce8e6';
  const badgeColor = isApproved ? '#1e8e3e' : '#d93025';

  const bodyMessage = isApproved
    ? `Great news! Your payment request for <strong>${categoryName}</strong> has been reviewed and <strong>approved</strong> by <strong>${orgName}</strong>. A transaction record has been created for your account.`
    : `Your payment request for <strong>${categoryName}</strong> has been reviewed by <strong>${orgName}</strong> and has unfortunately been <strong>rejected</strong>.`;

  const remarksSection =
    !isApproved && remarks
      ? `
        <div style="background-color:#fce8e6;border-left:4px solid #d93025;padding:14px 18px;border-radius:4px;margin:20px 0;">
          <p style="color:#d93025;font-size:13px;font-weight:bold;margin:0 0 6px;">Rejection Reason:</p>
          <p style="color:#5f6368;font-size:14px;margin:0;">${remarks}</p>
        </div>`
      : '';

  const studentPortalUrl = `${WEB_APP_ORIGIN || 'https://sbo-sims.vercel.app'}/#/student/transactions`;

  const contentHtml = `
    <p style="color:#5f6368;font-size:15px;margin:0 0 20px;">Hi <strong>${studentName}</strong>,</p>
    <p style="color:#5f6368;font-size:15px;line-height:1.6;margin:0 0 20px;">${bodyMessage}</p>
    ${remarksSection}
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fa;border-radius:6px;margin:24px 0;border:1px solid #e0e0e0;">
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #e0e0e0;">
          <span style="color:#9aa0a6;font-size:12px;display:block;margin-bottom:4px;">ORGANIZATION</span>
          <span style="color:#202124;font-size:14px;font-weight:bold;">${orgName}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #e0e0e0;">
          <span style="color:#9aa0a6;font-size:12px;display:block;margin-bottom:4px;">CATEGORY</span>
          <span style="color:#202124;font-size:14px;font-weight:bold;">${categoryName}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #e0e0e0;">
          <span style="color:#9aa0a6;font-size:12px;display:block;margin-bottom:4px;">AMOUNT</span>
          <span style="color:#202124;font-size:14px;font-weight:bold;">₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px;">
          <span style="color:#9aa0a6;font-size:12px;display:block;margin-bottom:4px;">STATUS</span>
          <span style="display:inline-block;background-color:${badgeBg};color:${badgeColor};padding:4px 12px;border-radius:999px;font-size:13px;font-weight:bold;">${statusLabel}</span>
        </td>
      </tr>
    </table>
    <p style="color:#5f6368;font-size:14px;line-height:1.6;margin:24px 0 0;">
      You can log in to your <a href="${studentPortalUrl}" style="color:#1a73e8;text-decoration:none;">SBO-SIMS Student Portal</a> to view more details about your request.
    </p>
  `;

  await sendSystemEmail({
    to,
    subject: `Payment Request ${statusLabel} — ${categoryName}`,
    preheader: `Your payment request for ${categoryName} has been ${status}.`,
    headerBackground: headerColor,
    headerTitle: 'SBO-SIMS',
    headerSubtitle: 'Payment Request Update',
    contentHtml,
  });
};

/**
 * Sends a welcome email containing login credentials to a newly created
 * org admin or org user account.
 */
export const sendWelcomeCredentialsEmail = async (
  to: string,
  name: string,
  studentID: string,
  password: string,
  orgName: string,
  orgLoginUrl: string,
) => {
  const contentHtml = `
    <h2 style="color:#202124;font-size:20px;margin:0 0 8px;">Welcome, ${name}!</h2>
    <p style="color:#5f6368;font-size:15px;line-height:1.6;margin:0 0 28px;">
      Your administrator account for <strong>${orgName}</strong> has been created on SBO-SIMS.
      Below are your login credentials — please keep them safe and change your password after your first login.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fa;border-radius:6px;border:1px solid #e0e0e0;margin:0 0 28px;">
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #e0e0e0;">
          <span style="color:#9aa0a6;font-size:11px;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">Organization</span>
          <span style="color:#202124;font-size:15px;font-weight:bold;">${orgName}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #e0e0e0;">
          <span style="color:#9aa0a6;font-size:11px;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">Student ID</span>
          <span style="color:#202124;font-size:15px;font-weight:bold;font-family:monospace;">${studentID}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px;">
          <span style="color:#9aa0a6;font-size:11px;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;">Temporary Password</span>
          <span style="color:#202124;font-size:15px;font-weight:bold;font-family:monospace;">${password}</span>
        </td>
      </tr>
    </table>
    <div style="text-align:center;margin:32px 0;">
      <a href="${orgLoginUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#ffffff;padding:14px 36px;text-decoration:none;border-radius:6px;font-size:16px;font-weight:bold;">
        Go to ${orgName} Dashboard
      </a>
    </div>
    <p style="color:#5f6368;font-size:13px;line-height:1.6;margin:0;">
      If the button above doesn't work, copy and paste this link into your browser:<br>
      <a href="${orgLoginUrl}" style="color:#7c3aed;word-break:break-all;">${orgLoginUrl}</a>
    </p>
  `;

  await sendSystemEmail({
    to,
    subject: `Welcome to ${orgName} — Your SBO-SIMS Credentials`,
    preheader: `Your ${orgName} SBO-SIMS account is ready. Here are your login credentials.`,
    headerBackground: 'linear-gradient(135deg,#7c3aed,#2563eb)',
    headerTitle: 'SBO-SIMS',
    headerSubtitle: 'Student Organization Management System',
    contentHtml,
  });
};

/**
 * Sends a forgot password email containing a reset link.
 */
export const sendForgotPasswordEmail = async (
  to: string,
  resetUrl: string,
) => {
  const contentHtml = `
    <h2 style="color:#202124;font-size:20px;margin:0 0 8px;">Reset Your Password</h2>
    <p style="color:#5f6368;font-size:15px;line-height:1.6;margin:0 0 28px;">
      We received a request to reset the password for your SBO-SIMS account.
      Click the button below to set a new password. This link will expire in 1 hour.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#ffffff;padding:14px 36px;text-decoration:none;border-radius:6px;font-size:16px;font-weight:bold;">
        Reset Password
      </a>
    </div>
    <p style="color:#5f6368;font-size:13px;line-height:1.6;margin:0;">
      If the button above doesn't work, copy and paste this link into your browser:<br>
      <a href="${resetUrl}" style="color:#7c3aed;word-break:break-all;">${resetUrl}</a>
    </p>
    <p style="color:#5f6368;font-size:13px;line-height:1.6;margin-top:20px;">
      If you did not request a password reset, you can safely ignore this email.
    </p>
  `;

  await sendSystemEmail({
    to,
    subject: 'Password Reset Request — SBO-SIMS',
    preheader: 'Reset your SBO-SIMS account password.',
    headerBackground: 'linear-gradient(135deg,#7c3aed,#2563eb)',
    headerTitle: 'SBO-SIMS',
    headerSubtitle: 'Student Organization Management System',
    contentHtml,
  });
};

// ─── Transaction Receipt Email ──────────────────────────────────────────────

export interface TransactionReceiptItemInput {
  categoryName: string;
  categoryFee: number;
  amountPaidNow: number;
  totalPaid: number;
  balance: number;
  status: 'Paid' | 'Partial';
  description?: string;
  details?: Record<string, any>;
}

export interface SendTransactionReceiptEmailParams {
  to: string;
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

/**
 * Sends an official electronic transaction receipt email to a student when a payment
 * is recorded or topped up.
 */
export const sendTransactionReceiptEmail = async (
  params: SendTransactionReceiptEmailParams,
) => {
  const {
    to,
    studentName,
    studentID,
    course,
    year,
    orgName,
    receiptNumber,
    date,
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

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const portalUrl = `${WEB_APP_ORIGIN || 'https://sbo-sims.vercel.app'}/#/student/transactions`;

  // Build items rows
  const itemsRowsHtml = items
    .map((item) => {
      let detailsHtml = '';
      if (item.details && typeof item.details === 'object') {
        const detailEntries = Object.entries(item.details).filter(
          ([_, v]) =>
            v !== undefined && v !== null && String(v).trim().length > 0,
        );
        if (detailEntries.length > 0) {
          detailsHtml = `
            <div style="margin-top:6px;">
              ${detailEntries
                .map(
                  ([key, val]) =>
                    `<span style="display:inline-block;background-color:#f1f5f9;color:#475569;border:1px solid #e2e8f0;border-radius:4px;padding:2px 8px;font-size:11px;margin-right:4px;margin-bottom:4px;">
                      <strong>${startCase(key)}:</strong> ${String(val)}
                    </span>`,
                )
                .join('')}
            </div>
          `;
        }
      }

      const itemBadgeBg = item.status === 'Paid' ? '#e6f4ea' : '#fef3c7';
      const itemBadgeColor = item.status === 'Paid' ? '#137333' : '#b45309';

      return `
        <tr>
          <td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;vertical-align:top;">
            <div style="font-size:14px;font-weight:bold;color:#0f172a;">${item.categoryName}</div>
            ${
              item.description
                ? `<div style="font-size:12px;color:#64748b;margin-top:2px;">${item.description}</div>`
                : ''
            }
            ${detailsHtml}
          </td>
          <td align="right" style="padding:14px 16px;border-bottom:1px solid #e2e8f0;font-family:monospace;font-size:14px;color:#475569;vertical-align:top;white-space:nowrap;">
            ${formatCurrency(item.categoryFee)}
          </td>
          <td align="right" style="padding:14px 16px;border-bottom:1px solid #e2e8f0;font-family:monospace;font-size:14px;font-weight:bold;color:#0f172a;vertical-align:top;white-space:nowrap;">
            ${formatCurrency(item.amountPaidNow)}
          </td>
          <td align="center" style="padding:14px 16px;border-bottom:1px solid #e2e8f0;vertical-align:top;">
            <span style="display:inline-block;background-color:${itemBadgeBg};color:${itemBadgeColor};padding:3px 10px;border-radius:999px;font-size:11px;font-weight:bold;text-transform:uppercase;">
              ${item.status}
            </span>
          </td>
        </tr>
      `;
    })
    .join('');

  const contentHtml = `
    <!-- Top Receipt Bar -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;border-bottom:2px solid #0f172a;padding-bottom:16px;">
      <tr>
        <td valign="top">
          <div style="font-size:11px;font-weight:bold;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">
            ${orgName}
          </div>
          <h2 style="margin:0;font-size:22px;font-weight:bold;color:#0f172a;letter-spacing:-0.3px;">
            Official Payment Receipt
          </h2>
          <div style="font-size:13px;color:#64748b;margin-top:4px;">
            Student Body Organization · Bukidnon State University
          </div>
        </td>
        <td align="right" valign="top">
          <div style="font-size:11px;font-weight:bold;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">
            RECEIPT NO.
          </div>
          <div style="font-family:monospace;font-size:15px;font-weight:bold;color:#0f172a;margin-top:2px;">
            #${receiptNumber}
          </div>
          <div style="font-size:12px;color:#64748b;margin-top:4px;">
            ${formattedDate}
          </div>
        </td>
      </tr>
    </table>

    <!-- Status & Mode Banner -->
    <div style="margin:0 0 24px 0;display:flex;align-items:center;">
      <span style="display:inline-block;background-color:${statusBadgeBg};color:${statusBadgeColor};border:1px solid ${statusBorderColor};padding:6px 14px;border-radius:999px;font-size:12px;font-weight:bold;letter-spacing:0.5px;text-transform:uppercase;">
        ${statusLabel}
      </span>
      <span style="display:inline-block;background-color:#f1f5f9;color:#334155;border:1px solid #cbd5e1;padding:6px 12px;border-radius:6px;font-size:12px;font-weight:bold;text-transform:uppercase;margin-left:8px;">
        Payment Mode: ${modeOfPayment}
      </span>
    </div>

    <!-- Student / Billed To Section -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;width:50%;">
          <span style="color:#94a3b8;font-size:11px;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;font-weight:bold;">BILLED TO</span>
          <span style="color:#0f172a;font-size:15px;font-weight:bold;">${studentName}</span>
        </td>
        <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;width:50%;">
          <span style="color:#94a3b8;font-size:11px;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;font-weight:bold;">STUDENT ID</span>
          <span style="color:#0f172a;font-size:14px;font-weight:bold;font-family:monospace;">${studentID}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px;width:50%;">
          <span style="color:#94a3b8;font-size:11px;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;font-weight:bold;">PROGRAM & YEAR</span>
          <span style="color:#334155;font-size:13px;font-weight:600;">
            ${course ? course.toUpperCase() : 'N/A'}${year ? ` · Year ${year}` : ''}
          </span>
        </td>
        <td style="padding:16px 20px;width:50%;">
          <span style="color:#94a3b8;font-size:11px;display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;font-weight:bold;">ACADEMIC TERM</span>
          <span style="color:#334155;font-size:13px;font-weight:600;">${termLabel}</span>
        </td>
      </tr>
    </table>

    <!-- Itemized Fee Breakdown Table -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;margin-bottom:20px;">
      <thead>
        <tr style="background-color:#0f172a;color:#ffffff;">
          <th align="left" style="padding:12px 16px;font-size:11px;font-weight:bold;letter-spacing:0.8px;text-transform:uppercase;">Description</th>
          <th align="right" style="padding:12px 16px;font-size:11px;font-weight:bold;letter-spacing:0.8px;text-transform:uppercase;">Fee</th>
          <th align="right" style="padding:12px 16px;font-size:11px;font-weight:bold;letter-spacing:0.8px;text-transform:uppercase;">Paid</th>
          <th align="center" style="padding:12px 16px;font-size:11px;font-weight:bold;letter-spacing:0.8px;text-transform:uppercase;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRowsHtml}
      </tbody>
    </table>

    <!-- Totals Calculation Block -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
      <tr>
        <td width="40%"></td>
        <td width="60%">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px 0;">
            <tr>
              <td style="padding:8px 18px;font-size:13px;color:#64748b;">Total Fee:</td>
              <td align="right" style="padding:8px 18px;font-family:monospace;font-size:13px;color:#334155;">
                ${formatCurrency(totalFee)}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 18px;font-size:14px;font-weight:bold;color:#0f172a;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;">
                Amount Paid (This Txn):
              </td>
              <td align="right" style="padding:8px 18px;font-family:monospace;font-size:16px;font-weight:bold;color:#0f172a;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;">
                ${formatCurrency(totalAmountPaidNow)}
              </td>
            </tr>
            ${
              !isAllPaid
                ? `
                  <tr>
                    <td style="padding:8px 18px;font-size:13px;font-weight:bold;color:#dc2626;">Remaining Balance:</td>
                    <td align="right" style="padding:8px 18px;font-family:monospace;font-size:14px;font-weight:bold;color:#dc2626;">
                      ${formatCurrency(totalBalance)}
                    </td>
                  </tr>
                `
                : ''
            }
          </table>
        </td>
      </tr>
    </table>

    <!-- Signatories Block -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-top:1px dashed #cbd5e1;padding-top:20px;margin-bottom:24px;">
      <tr>
        <td align="center" style="width:33.33%;padding:10px 8px;">
          <div style="font-size:13px;font-weight:bold;color:#0f172a;text-transform:uppercase;">
            ${recordedByName || 'Authorized Officer'}
          </div>
          <div style="border-top:1px solid #94a3b8;margin:6px 16px 4px 16px;"></div>
          <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Recorded By</div>
        </td>
        <td align="center" style="width:33.33%;padding:10px 8px;">
          <div style="font-size:13px;font-weight:bold;color:#0f172a;text-transform:uppercase;">
            ${treasurerName || 'Treasurer'}
          </div>
          <div style="border-top:1px solid #94a3b8;margin:6px 16px 4px 16px;"></div>
          <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Treasurer</div>
        </td>
        <td align="center" style="width:33.33%;padding:10px 8px;">
          <div style="font-size:13px;font-weight:bold;color:#0f172a;text-transform:uppercase;">
            ${governorName || 'Governor'}
          </div>
          <div style="border-top:1px solid #94a3b8;margin:6px 16px 4px 16px;"></div>
          <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Governor</div>
        </td>
      </tr>
    </table>

    <!-- Call to action button -->
    <div style="text-align:center;margin:28px 0 10px;">
      <a href="${portalUrl}" style="display:inline-block;background-color:#0f172a;color:#ffffff;padding:12px 28px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:bold;letter-spacing:0.3px;">
        View in Student Portal
      </a>
    </div>
  `;

  const footerHtml = `
    <p style="color:#94a3b8;font-size:12px;margin:0 0 6px;line-height:1.5;">
      This electronic receipt is officially generated by SBO-SIMS for ${orgName}.<br>
      Bukidnon State University · Please retain this email for your financial clearance and personal records.
    </p>
    <p style="color:#cbd5e1;font-size:11px;margin:0;">
      Do not reply directly to this automated email.
    </p>
  `;

  await sendSystemEmail({
    to,
    subject: `Official Receipt #${receiptNumber} — ${orgName}`,
    preheader: `Payment confirmation of ${formatCurrency(totalAmountPaidNow)} for ${items.map((i) => i.categoryName).join(', ')}.`,
    headerBackground: 'linear-gradient(135deg,#0f172a,#1e293b)',
    headerTitle: 'SBO-SIMS',
    headerSubtitle: 'Official Electronic Payment Receipt',
    contentHtml,
    footerHtml,
  });
};
