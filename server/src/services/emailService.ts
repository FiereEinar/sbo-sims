import nodemailer from 'nodemailer';
import { EMAIL_USER, EMAIL_PASS } from '../constants/env';

const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: EMAIL_USER,
		pass: EMAIL_PASS,
	},
});

export const sendVerificationEmail = async (to: string, verificationUrl: string) => {
	const mailOptions = {
		from: `"SBO-SIMS" <${EMAIL_USER}>`,
		to,
		subject: 'Verify your SBO-SIMS Account',
		html: `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
				<h2 style="color: #333; text-align: center;">Welcome to SBO-SIMS!</h2>
				<p style="color: #555; font-size: 16px;">
					Please verify your email address to activate your account. This link will expire in 24 hours.
				</p>
				<div style="text-align: center; margin: 30px 0;">
					<a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">Verify Email</a>
				</div>
				<p style="color: #999; font-size: 14px; text-align: center;">
					If you did not request this, please ignore this email.
				</p>
			</div>
		`,
	};

	await transporter.sendMail(mailOptions);
};
