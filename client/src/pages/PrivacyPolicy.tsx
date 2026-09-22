import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import Header from '@/components/ui/header';

const DPO_EMAIL = import.meta.env.VITE_DPO_EMAIL || 'cotsbo@buksu.edu.ph';
const LAST_UPDATED = 'September 22, 2026';

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm px-4 sm:px-8 py-3 flex items-center gap-3">
        <Link
          to="/login"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <div className="flex items-center gap-2 ml-2">
          <Shield className="size-4 text-primary" />
          <span className="text-sm font-medium">SBO-SIMS</span>
        </div>
      </div>

      {/* Content */}
      <article className="mx-auto max-w-3xl px-4 sm:px-8 py-12 space-y-10">
        <div className="space-y-2">
          <Header>Privacy Policy</Header>
          <p className="text-sm text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        <Section title="1. Introduction">
          <p>
            The <strong>Student Body Organization – Student Information Management System (SBO-SIMS)</strong> is operated
            by the College of Technology (COT) Student Body Organization of{' '}
            <strong>Bukidnon State University (BukSU)</strong>. We are committed to protecting your personal
            information and your rights under the{' '}
            <strong>Philippine Data Privacy Act of 2012 (Republic Act No. 10173)</strong> and its Implementing
            Rules and Regulations.
          </p>
          <p>
            This Privacy Policy explains what personal data we collect, how we use it, who we share it with,
            how long we keep it, and what your rights are as a data subject.
          </p>
          <p>
            By creating an account or using SBO-SIMS, you acknowledge that you have read and understood this
            policy, and you consent to the collection and processing of your personal data as described herein.
          </p>
        </Section>

        <Section title="2. What Personal Data We Collect">
          <p>We collect the following categories of personal data:</p>
          <SubSection title="a. Account &amp; Identity Information">
            <ul>
              <li>Full name (first name, last name, middle name)</li>
              <li>Student ID number</li>
              <li>Institutional email address (<em>studentID</em>@student.buksu.edu.ph)</li>
              <li>Password (stored in hashed, non-reversible form)</li>
              <li>Gender</li>
              <li>Course and year level</li>
              <li>Section</li>
            </ul>
          </SubSection>
          <SubSection title="b. Academic &amp; Organizational Data">
            <ul>
              <li>Enrollment records per semester and school year</li>
              <li>Organization membership and affiliation</li>
              <li>Attendance records at organization events</li>
              <li>Grade-point average (GPOA) data submitted to the system</li>
            </ul>
          </SubSection>
          <SubSection title="c. Financial Data">
            <ul>
              <li>Transaction records (fees paid, payment categories, amounts)</li>
              <li>Payment requests submitted by students (amount, mode of payment, reference numbers)</li>
              <li>Receipt images uploaded as proof of payment (stored locally; file uploads are currently
                disabled on the web version)</li>
            </ul>
          </SubSection>
          <SubSection title="d. Technical Data">
            <ul>
              <li>IP address (used for rate limiting and security purposes)</li>
              <li>Browser / user-agent string</li>
              <li>Session and authentication tokens (stored in secure HTTP-only cookies)</li>
              <li>Timestamps of logins, data creation, and data updates</li>
            </ul>
          </SubSection>
          <SubSection title="e. Support Communications">
            <ul>
              <li>Content of support tickets and messages submitted through the in-app support system</li>
            </ul>
          </SubSection>
        </Section>

        <Section title="3. How We Use Your Personal Data">
          <p>We process your personal data solely for the following legitimate purposes:</p>
          <ul>
            <li>
              <strong>Account Management:</strong> Creating and maintaining your account, verifying your email,
              and enabling secure login.
            </li>
            <li>
              <strong>SBO Operations:</strong> Managing student enrollment lists, tracking payment of
              organization fees, recording event attendance, and producing GPOA and financial reports for
              the organization.
            </li>
            <li>
              <strong>Payment Processing:</strong> Recording, reviewing, and approving payment requests
              submitted by students.
            </li>
            <li>
              <strong>Communications:</strong> Sending account verification and password-reset emails to your
              institutional email address.
            </li>
            <li>
              <strong>System Security:</strong> Detecting and preventing unauthorized access, fraud, and abuse.
            </li>
            <li>
              <strong>Technical Support:</strong> Resolving issues you report through the support ticket system.
            </li>
          </ul>
          <p>
            We do <strong>not</strong> sell, rent, or trade your personal data to any third party for commercial
            or marketing purposes.
          </p>
        </Section>

        <Section title="4. Third-Party Service Providers">
          <p>
            We use the following trusted third-party service providers to operate SBO-SIMS. Each provider
            has their own privacy policy governing their handling of data.
          </p>
          <table>
            <thead>
              <tr>
                <th>Provider</th>
                <th>Purpose</th>
                <th>Data Involved</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Google reCAPTCHA v2</strong>
                  <br />
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                    Google Privacy Policy ↗
                  </a>
                </td>
                <td>Bot and abuse prevention on the login form</td>
                <td>IP address, browser/device information, interaction behaviour</td>
              </tr>
              <tr>
                <td>
                  <strong>MongoDB Atlas</strong>
                  <br />
                  <a href="https://www.mongodb.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
                    MongoDB Privacy Policy ↗
                  </a>
                </td>
                <td>Cloud database storage for the web version of SBO-SIMS</td>
                <td>All data stored in the system (stored encrypted at rest)</td>
              </tr>
              <tr>
                <td>
                  <strong>Vercel</strong>
                  <br />
                  <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
                    Vercel Privacy Policy ↗
                  </a>
                </td>
                <td>Web server hosting for the SBO-SIMS web application</td>
                <td>Server request logs, IP addresses</td>
              </tr>
            </tbody>
          </table>
          <SubSection title="Planned Future Integration">
            <p>
              We plan to offer <strong>Google Sign-In</strong> as an optional login method in a future update.
              If implemented, Google's OAuth service will be used for authentication only. We will update this
              policy and notify users before this feature is enabled.
            </p>
          </SubSection>
        </Section>

        <Section title="5. Data Retention">
          <p>
            We retain your personal data only for as long as it is necessary for the purposes described in this
            policy, or as required by applicable law:
          </p>
          <ul>
            <li>
              <strong>Active accounts:</strong> Retained for the duration of your enrollment or officer tenure
              at BukSU, and for a reasonable period thereafter.
            </li>
            <li>
              <strong>Transaction and financial records:</strong> Retained for a minimum of five (5) years in
              accordance with standard organizational and financial record-keeping practices.
            </li>
            <li>
              <strong>Support ticket records:</strong> Retained for one (1) year after the ticket is resolved.
            </li>
            <li>
              <strong>Inactive accounts:</strong> Accounts with no activity for three (3) consecutive school
              years may be archived or deleted.
            </li>
          </ul>
          <p>
            You may request deletion of your account and personal data at any time (see Section 6 below).
          </p>
        </Section>

        <Section title="6. Your Rights as a Data Subject">
          <p>
            Under the Data Privacy Act of 2012 (RA 10173), you have the following rights:
          </p>
          <ul>
            <li>
              <strong>Right to be Informed:</strong> To be notified that your personal data is being collected
              and processed, including the purposes for processing (this policy fulfils this obligation).
            </li>
            <li>
              <strong>Right to Access:</strong> To obtain a copy of the personal data we hold about you.
            </li>
            <li>
              <strong>Right to Rectification:</strong> To correct inaccurate or incomplete personal data.
            </li>
            <li>
              <strong>Right to Erasure / Blocking:</strong> To request the deletion or blocking of your
              personal data where it is no longer necessary for the purposes it was collected, or where you
              withdraw your consent.
            </li>
            <li>
              <strong>Right to Object:</strong> To object to the processing of your personal data in certain
              circumstances.
            </li>
            <li>
              <strong>Right to Data Portability:</strong> To receive your personal data in a structured,
              commonly used, and machine-readable format.
            </li>
            <li>
              <strong>Right to Lodge a Complaint:</strong> To file a complaint with the{' '}
              <a href="https://www.privacy.gov.ph" target="_blank" rel="noopener noreferrer">
                National Privacy Commission (NPC) ↗
              </a>{' '}
              if you believe your data privacy rights have been violated.
            </li>
            <li>
              <strong>Right to Damages:</strong> To be indemnified for damages sustained due to inaccurate,
              incomplete, outdated, false, unlawfully obtained, or unauthorised use of personal data.
            </li>
          </ul>
          <p>
            To exercise any of these rights, please contact our Data Protection Officer (see Section 8).
          </p>
        </Section>

        <Section title="7. Data Security">
          <p>We implement the following technical and organisational measures to protect your personal data:</p>
          <ul>
            <li>Passwords are stored using a strong one-way hashing algorithm (bcrypt); we never store
              plain-text passwords.</li>
            <li>All communication between your browser and our servers is encrypted via HTTPS/TLS.</li>
            <li>Authentication sessions use secure, HTTP-only cookies to prevent cross-site scripting
              (XSS) attacks.</li>
            <li>Role-based access control (RBAC) ensures that users can only access data they are
              authorised to view.</li>
            <li>Data is isolated per organisation; officers of one organisation cannot access data from
              another.</li>
            <li>The desktop version stores data locally on your device; it is your responsibility to
              secure your device.</li>
          </ul>
          <p>
            While we take reasonable measures to protect your data, no system is 100% secure. In the event
            of a data breach that is likely to result in a risk to your rights and freedoms, we will notify
            the affected users and the NPC as required by law.
          </p>
        </Section>

        <Section title="8. Contact Our Data Protection Officer">
          <p>
            For any questions, concerns, or requests related to this Privacy Policy or the processing of your
            personal data, please contact our Data Protection Officer:
          </p>
          <div className="mt-3 rounded-xl border bg-card px-5 py-4 space-y-1">
            <p className="font-semibold">COT SBO — Data Protection Officer</p>
            <p className="text-sm text-muted-foreground">Bukidnon State University</p>
            <p className="text-sm">
              Email:{' '}
              <a href={`mailto:${DPO_EMAIL}`} className="text-primary underline">
                {DPO_EMAIL}
              </a>
            </p>
          </div>
        </Section>

        <Section title="9. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices or in
            applicable law. When we make material changes, we will update the "Last updated" date at the top
            of this page and, where appropriate, notify users through the system or via email. Your continued
            use of SBO-SIMS after any changes constitutes your acceptance of the updated policy.
          </p>
        </Section>

        {/* Footer links */}
        <div className="pt-6 border-t flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link to="/terms-of-service" className="underline hover:text-foreground transition-colors">
            Terms of Service
          </Link>
          <Link to="/login" className="underline hover:text-foreground transition-colors">
            Back to Login
          </Link>
        </div>
      </article>
    </main>
  );
}

/* ── Internal helper components ─────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:space-y-1.5 [&_strong]:text-foreground [&_table]:w-full [&_table]:border-collapse [&_th]:text-left [&_th]:text-xs [&_th]:uppercase [&_th]:tracking-wider [&_th]:py-2 [&_th]:px-3 [&_th]:border-b [&_td]:py-2.5 [&_td]:px-3 [&_td]:border-b [&_td]:align-top [&_td]:text-xs">
        {children}
      </div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 mt-3">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      {children}
    </div>
  );
}
