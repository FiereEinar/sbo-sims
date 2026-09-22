import { Link } from 'react-router-dom';
import { ArrowLeft, ScrollText } from 'lucide-react';
import Header from '@/components/ui/header';

const LAST_UPDATED = 'September 22, 2026';

export default function TermsOfService() {
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
          <ScrollText className="size-4 text-primary" />
          <span className="text-sm font-medium">SBO-SIMS</span>
        </div>
      </div>

      {/* Content */}
      <article className="mx-auto max-w-3xl px-4 sm:px-8 py-12 space-y-10">
        <div className="space-y-2">
          <Header>Terms of Service</Header>
          <p className="text-sm text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using the <strong>Student Body Organization – Student Information Management
            System (SBO-SIMS)</strong> operated by the College of Technology (COT) Student Body Organization
            of <strong>Bukidnon State University (BukSU)</strong>, you agree to be bound by these Terms of
            Service and our{' '}
            <Link to="/privacy-policy">Privacy Policy</Link>.
          </p>
          <p>
            If you do not agree to these terms, you must not use SBO-SIMS.
          </p>
          <p>
            These terms are governed by and construed in accordance with the laws of the{' '}
            <strong>Republic of the Philippines</strong>, including but not limited to the{' '}
            <strong>Data Privacy Act of 2012 (RA 10173)</strong> and the{' '}
            <strong>Cybercrime Prevention Act of 2012 (RA 10175)</strong>.
          </p>
        </Section>

        <Section title="2. Who May Use SBO-SIMS">
          <p>SBO-SIMS is an internal system intended for use by:</p>
          <ul>
            <li>
              <strong>Students</strong> currently enrolled at BukSU who have a valid institutional Student ID.
            </li>
            <li>
              <strong>Organization Officers and Admins</strong> who have been assigned access by their
              respective SBO organization.
            </li>
            <li>
              <strong>Central System Administrators</strong> who manage the system at a university level.
            </li>
          </ul>
          <p>
            Unauthorized access by individuals outside these categories is strictly prohibited and may
            constitute a criminal offence under RA 10175 (Cybercrime Prevention Act).
          </p>
        </Section>

        <Section title="3. User Accounts and Responsibilities">
          <p>
            You are responsible for:
          </p>
          <ul>
            <li>Maintaining the confidentiality of your account credentials (Student ID and password).</li>
            <li>All activities that occur under your account.</li>
            <li>Notifying us immediately at{' '}
              <a href={`mailto:${import.meta.env.VITE_DPO_EMAIL || 'cotsbo@buksu.edu.ph'}`}>
                {import.meta.env.VITE_DPO_EMAIL || 'cotsbo@buksu.edu.ph'}
              </a>{' '}
              if you suspect unauthorized access to your account.
            </li>
            <li>Ensuring that the personal information you provide during registration is accurate and up to date.</li>
          </ul>
          <p>
            You must <strong>not</strong>:
          </p>
          <ul>
            <li>Share your login credentials with any other person.</li>
            <li>Use another person's account without their permission.</li>
            <li>Attempt to access data belonging to another user, student, or organization that you are not
              authorized to view.</li>
            <li>Use the system for any purpose other than its intended academic and organizational management
              functions.</li>
          </ul>
        </Section>

        <Section title="4. Acceptable Use">
          <p>You agree to use SBO-SIMS only for lawful purposes. You must not:</p>
          <ul>
            <li>Submit false, misleading, or fraudulent information (e.g., fake payment receipts or
              inflated transaction amounts).</li>
            <li>Attempt to gain unauthorized access to any part of the system, servers, or databases.</li>
            <li>Introduce malware, viruses, or any other malicious code into the system.</li>
            <li>Attempt to reverse-engineer, scrape, or systematically extract data from the system.</li>
            <li>Harass, intimidate, or harm other users through the support ticket or messaging features.</li>
            <li>Use automated bots or scripts to interact with the system in a way that disrupts normal
              operations.</li>
          </ul>
          <p>
            Violations of this section may result in immediate suspension of your account and may be reported
            to the appropriate university disciplinary body and/or law enforcement.
          </p>
        </Section>

        <Section title="5. Data and Privacy">
          <p>
            Your use of SBO-SIMS involves the collection and processing of your personal data. Please refer
            to our{' '}
            <Link to="/privacy-policy">Privacy Policy</Link>{' '}
            for full details on what data we collect, why we collect it, and your rights under the Data
            Privacy Act of 2012.
          </p>
          <p>
            By using SBO-SIMS, you explicitly consent to the processing of your personal data as described
            in the Privacy Policy.
          </p>
        </Section>

        <Section title="6. Payment and Financial Records">
          <p>
            SBO-SIMS records and tracks organization fee payments and student payment requests. These are
            official records managed by the COT SBO and used for internal accounting.
          </p>
          <ul>
            <li>Payment records are final once approved by an authorized officer. Disputes should be raised
              in person with your organization's treasurer or through a support ticket.</li>
            <li>SBO-SIMS does not directly process monetary payments. It records and tracks transactions
              that occur offline or via third-party payment channels (e.g., GCash).</li>
            <li>Do not upload payment receipts that have been altered or fabricated. Doing so may
              constitute fraud under applicable Philippine law.</li>
          </ul>
        </Section>

        <Section title="7. Intellectual Property">
          <p>
            SBO-SIMS, including its source code, design, and content, is the intellectual property of the
            COT SBO development team and BukSU. You are granted a limited, non-exclusive, non-transferable
            licence to use the system solely for its intended purpose. You may not:
          </p>
          <ul>
            <li>Copy, reproduce, or distribute any part of the system or its content.</li>
            <li>Modify or create derivative works based on the system without written permission.</li>
          </ul>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>
            SBO-SIMS is provided <strong>"as is"</strong> for internal organizational management purposes.
            To the maximum extent permitted by applicable law, the COT SBO and BukSU shall not be liable
            for any:
          </p>
          <ul>
            <li>Indirect, incidental, or consequential damages arising from your use of the system.</li>
            <li>Loss of data due to technical failures, accidental deletion, or force majeure events.</li>
            <li>Inaccuracies in records that result from incorrect information submitted by users.</li>
          </ul>
          <p>
            We make reasonable efforts to keep the system available and accurate, but we do not guarantee
            uninterrupted access or error-free operation.
          </p>
        </Section>

        <Section title="9. Termination of Access">
          <p>
            We reserve the right to suspend or terminate your access to SBO-SIMS at any time, without notice,
            if we reasonably believe you have violated these Terms of Service or applicable law.
          </p>
          <p>
            You may also request the deletion of your account at any time by contacting our Data Protection
            Officer.
          </p>
        </Section>

        <Section title="10. Changes to These Terms">
          <p>
            We may update these Terms of Service from time to time. When we do, we will update the
            "Last updated" date at the top of this page. Material changes will be communicated through
            the system or via email. Your continued use of SBO-SIMS after any changes constitutes your
            acceptance of the updated terms.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>
            For questions about these Terms of Service, please contact us at:{' '}
            <a href={`mailto:${import.meta.env.VITE_DPO_EMAIL || 'cotsbo@buksu.edu.ph'}`}>
              {import.meta.env.VITE_DPO_EMAIL || 'cotsbo@buksu.edu.ph'}
            </a>
          </p>
        </Section>

        {/* Footer links */}
        <div className="pt-6 border-t flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link to="/privacy-policy" className="underline hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <Link to="/login" className="underline hover:text-foreground transition-colors">
            Back to Login
          </Link>
        </div>
      </article>
    </main>
  );
}

/* ── Internal helper component ───────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:space-y-1.5 [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}
