import nodemailer from 'nodemailer';
import { EMAIL_USER, EMAIL_PASS } from '../constants/env';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

/**
 * Sends a verification email to a newly registered user.
 */
export const sendVerificationEmail = async (
  to: string,
  verificationUrl: string,
) => {
  const mailOptions = {
    from: `"SBO-SIMS" <${EMAIL_USER}>`,
    replyTo: EMAIL_USER,
    to,
    subject: 'Verify your SBO-SIMS Account',
    headers: {
      'X-Mailer': 'SBO-SIMS Mailer',
      'X-Priority': '3',
      Precedence: 'bulk',
      'List-Unsubscribe': `<mailto:${EMAIL_USER}?subject=unsubscribe>`,
    },
    html: `
			<!DOCTYPE html>
			<html lang="en">
			<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
			<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
				<!-- Preheader text (hidden, for email clients) -->
				<span style="display:none;font-size:1px;color:#f4f4f4;max-height:0;max-width:0;opacity:0;overflow:hidden;">Verify your SBO-SIMS account to get started.</span>

				<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px 0;">
					<tr>
						<td align="center">
							<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">
								<!-- Header -->
								<tr>
									<td style="background-color:#1a73e8;padding:30px;text-align:center;">
										<h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:bold;">SBO-SIMS</h1>
										<p style="color:#c8e0ff;margin:6px 0 0;font-size:13px;">Student Organization Management System</p>
									</td>
								</tr>
								<!-- Body -->
								<tr>
									<td style="padding:40px 30px;">
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
									</td>
								</tr>
								<!-- Footer -->
								<tr>
									<td style="background-color:#f8f9fa;padding:20px 30px;border-top:1px solid #e0e0e0;text-align:center;">
										<p style="color:#9aa0a6;font-size:12px;margin:0;">
											You received this email because someone registered an account using this address on SBO-SIMS.<br>
											If this wasn't you, you can safely ignore this email.
										</p>
									</td>
								</tr>
							</table>
						</td>
					</tr>
				</table>
			</body>
			</html>
		`,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Sends a payment request status notification email to the student.
 * @param to - Student's email address
 * @param studentName - Full name of the student
 * @param categoryName - Name of the payment category
 * @param orgName - Name of the organization
 * @param amount - Amount requested (in PHP)
 * @param status - 'approved' | 'rejected'
 * @param remarks - Optional rejection remarks
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

  const mailOptions = {
    from: `"SBO-SIMS" <${EMAIL_USER}>`,
    replyTo: EMAIL_USER,
    to,
    subject: `Payment Request ${statusLabel} — ${categoryName}`,
    headers: {
      'X-Mailer': 'SBO-SIMS Mailer',
      'X-Priority': '3',
      Precedence: 'bulk',
      'List-Unsubscribe': `<mailto:${EMAIL_USER}?subject=unsubscribe>`,
    },
    html: `
			<!DOCTYPE html>
			<html lang="en">
			<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
			<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
				<!-- Preheader -->
				<span style="display:none;font-size:1px;color:#f4f4f4;max-height:0;max-width:0;opacity:0;overflow:hidden;">Your payment request for ${categoryName} has been ${status}.</span>

				<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px 0;">
					<tr>
						<td align="center">
							<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">
								<!-- Header -->
								<tr>
									<td style="background-color:${headerColor};padding:30px;text-align:center;">
										<h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:bold;">SBO-SIMS</h1>
										<p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px;">Payment Request Update</p>
									</td>
								</tr>
								<!-- Body -->
								<tr>
									<td style="padding:40px 30px;">
										<p style="color:#5f6368;font-size:15px;margin:0 0 20px;">Hi <strong>${studentName}</strong>,</p>

										<p style="color:#5f6368;font-size:15px;line-height:1.6;margin:0 0 20px;">${bodyMessage}</p>

										${remarksSection}

										<!-- Request Details -->
										<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fa;border-radius:6px;padding:4px;margin:24px 0;border:1px solid #e0e0e0;">
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
													<span style="color:#202124;font-size:14px;font-weight:bold;">₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
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
											You can log in to your <a href="" style="color:#1a73e8;text-decoration:none;">SBO-SIMS Student Portal</a> to view more details about your request.
										</p>
									</td>
								</tr>
								<!-- Footer -->
								<tr>
									<td style="background-color:#f8f9fa;padding:20px 30px;border-top:1px solid #e0e0e0;text-align:center;">
										<p style="color:#9aa0a6;font-size:12px;margin:0;">
											This is an automated notification from SBO-SIMS.<br>
											Please do not reply directly to this email.
										</p>
									</td>
								</tr>
							</table>
						</td>
					</tr>
				</table>
			</body>
			</html>
		`,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Sends a welcome email containing login credentials to a newly created
 * org admin or org user account.
 *
 * @param to          - Recipient email address
 * @param name        - Full name of the recipient (e.g. "Juan Dela Cruz")
 * @param studentID   - The account's Student ID
 * @param password    - The plain-text password set during account creation
 * @param orgName     - Display name of the organization
 * @param orgLoginUrl - Direct URL to the organization's login page
 */
export const sendWelcomeCredentialsEmail = async (
  to: string,
  name: string,
  studentID: string,
  password: string,
  orgName: string,
  orgLoginUrl: string,
) => {
  const mailOptions = {
    from: `"SBO-SIMS" <${EMAIL_USER}>`,
    replyTo: EMAIL_USER,
    to,
    subject: `Welcome to ${orgName} — Your SBO-SIMS Credentials`,
    headers: {
      'X-Mailer': 'SBO-SIMS Mailer',
      'X-Priority': '3',
      Precedence: 'bulk',
      'List-Unsubscribe': `<mailto:${EMAIL_USER}?subject=unsubscribe>`,
    },
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
        <!-- Preheader -->
        <span style="display:none;font-size:1px;color:#f4f4f4;max-height:0;max-width:0;opacity:0;overflow:hidden;">Your ${orgName} SBO-SIMS account is ready. Here are your login credentials.</span>

        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#7c3aed,#2563eb);padding:30px;text-align:center;">
                    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:bold;">SBO-SIMS</h1>
                    <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px;">Student Organization Management System</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:40px 30px;">
                    <h2 style="color:#202124;font-size:20px;margin:0 0 8px;">Welcome, ${name}!</h2>
                    <p style="color:#5f6368;font-size:15px;line-height:1.6;margin:0 0 28px;">
                      Your administrator account for <strong>${orgName}</strong> has been created on SBO-SIMS.
                      Below are your login credentials — please keep them safe and change your password after your first login.
                    </p>

                    <!-- Credentials box -->
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

                    <!-- CTA button -->
                    <div style="text-align:center;margin:32px 0;">
                      <a href="${orgLoginUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#ffffff;padding:14px 36px;text-decoration:none;border-radius:6px;font-size:16px;font-weight:bold;">
                        Go to ${orgName} Dashboard
                      </a>
                    </div>

                    <p style="color:#5f6368;font-size:13px;line-height:1.6;margin:0;">
                      If the button above doesn't work, copy and paste this link into your browser:<br>
                      <a href="${orgLoginUrl}" style="color:#7c3aed;word-break:break-all;">${orgLoginUrl}</a>
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color:#f8f9fa;padding:20px 30px;border-top:1px solid #e0e0e0;text-align:center;">
                    <p style="color:#9aa0a6;font-size:12px;margin:0;">
                      This is an automated message from SBO-SIMS. Please do not reply directly to this email.<br>
                      If you did not expect this message, please contact your system administrator.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Sends a forgot password email containing a reset link.
 *
 * @param to       - Recipient email address
 * @param resetUrl - URL to redirect the user to the reset password page
 */
export const sendForgotPasswordEmail = async (
  to: string,
  resetUrl: string,
) => {
  const mailOptions = {
    from: `"SBO-SIMS" <${EMAIL_USER}>`,
    replyTo: EMAIL_USER,
    to,
    subject: `Password Reset Request — SBO-SIMS`,
    headers: {
      'X-Mailer': 'SBO-SIMS Mailer',
      'X-Priority': '3',
      Precedence: 'bulk',
      'List-Unsubscribe': `<mailto:${EMAIL_USER}?subject=unsubscribe>`,
    },
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
        <!-- Preheader -->
        <span style="display:none;font-size:1px;color:#f4f4f4;max-height:0;max-width:0;opacity:0;overflow:hidden;">Reset your SBO-SIMS account password.</span>

        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#7c3aed,#2563eb);padding:30px;text-align:center;">
                    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:bold;">SBO-SIMS</h1>
                    <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px;">Student Organization Management System</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:40px 30px;">
                    <h2 style="color:#202124;font-size:20px;margin:0 0 8px;">Reset Your Password</h2>
                    <p style="color:#5f6368;font-size:15px;line-height:1.6;margin:0 0 28px;">
                      We received a request to reset the password for your SBO-SIMS account.
                      Click the button below to set a new password. This link will expire in 1 hour.
                    </p>

                    <!-- CTA button -->
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
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color:#f8f9fa;padding:20px 30px;border-top:1px solid #e0e0e0;text-align:center;">
                    <p style="color:#9aa0a6;font-size:12px;margin:0;">
                      This is an automated message from SBO-SIMS. Please do not reply directly to this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};
