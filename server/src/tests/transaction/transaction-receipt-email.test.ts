import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveStudentEmail, getStudentEmail } from '../../utils/student';
import {
  renderEmailLayout,
  sendTransactionReceiptEmail,
  sendVerificationEmail,
  sendPaymentRequestStatusEmail,
  sendWelcomeCredentialsEmail,
  sendForgotPasswordEmail,
  transporter,
} from '../../services/emailService';
import {
  notifyStudentTransactionRecorded,
  notifyStudentBatchTransactionsRecorded,
  notifyStudentTransactionAmountUpdated,
} from '../../services/transactionEmail.service';
import UserModel from '../../models/user.model';

const sendMailMock = vi
  .spyOn(transporter, 'sendMail')
  .mockResolvedValue({ messageId: 'test-message-id' } as any);

describe('Student Email Resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use the student email when present on student record', async () => {
    const email = await resolveStudentEmail({
      studentID: '2301106599',
      email: 'custom.student@gmail.com',
    });

    expect(email).toBe('custom.student@gmail.com');
  });

  it('should fallback to registered user email if student record email is empty', async () => {
    vi.spyOn(UserModel, 'findOne').mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          email: 'user.registered@example.com',
        }),
      }),
    } as any);

    const email = await resolveStudentEmail({
      studentID: '2301106599',
      email: '',
    });

    expect(email).toBe('user.registered@example.com');
  });

  it('should fallback to studentID + STUDENT_EMAIL_DOMAIN when no email is available', async () => {
    vi.spyOn(UserModel, 'findOne').mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      }),
    } as any);

    const email = await resolveStudentEmail({
      studentID: '2301106599',
      email: undefined,
    });

    expect(email).toBe('2301106599@student.buksu.edu.ph');
  });

  it('should export getStudentEmail as an alias', () => {
    expect(getStudentEmail).toBe(resolveStudentEmail);
  });
});

describe('Email Service & Transaction Receipt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render email layout with proper structure', () => {
    const html = renderEmailLayout({
      headerTitle: 'Test Title',
      headerSubtitle: 'Test Subtitle',
      preheader: 'Hidden preview text',
      contentHtml: '<p>Content body</p>',
    });

    expect(html).toContain('Test Title');
    expect(html).toContain('Test Subtitle');
    expect(html).toContain('Hidden preview text');
    expect(html).toContain('<p>Content body</p>');
    expect(html).toContain('SBO-SIMS');
  });

  it('should format and send a real transaction receipt email', async () => {
    await sendTransactionReceiptEmail({
      to: 'student@student.buksu.edu.ph',
      studentName: 'Juan Dela Cruz',
      studentID: '2301106599',
      course: 'BSIT',
      year: 3,
      orgName: 'Computer Studies Student Body Organization',
      receiptNumber: '8E3A1290',
      date: new Date('2026-10-15T10:30:00Z'),
      modeOfPayment: 'cash',
      semester: '1',
      schoolYear: '2025-2026',
      recordedByName: 'Admin Officer',
      treasurerName: 'Treasurer Jane',
      governorName: 'Gov John',
      items: [
        {
          categoryName: 'Departmental Membership Fee',
          categoryFee: 500,
          amountPaidNow: 500,
          totalPaid: 500,
          balance: 0,
          status: 'Paid',
          description: 'Official 1st semester organization dues',
          details: { size: 'L' },
        },
      ],
      totalAmountPaidNow: 500,
      totalFee: 500,
      totalBalance: 0,
    });

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const mailArgs = sendMailMock.mock.calls[0][0];

    expect(mailArgs.to).toBe('student@student.buksu.edu.ph');
    expect(mailArgs.subject).toContain('Official Receipt #8E3A1290');
    expect(mailArgs.subject).toContain('Computer Studies Student Body Organization');

    const html = mailArgs.html;
    expect(html).toContain('Official Payment Receipt');
    expect(html).toContain('#8E3A1290');
    expect(html).toContain('Juan Dela Cruz');
    expect(html).toContain('2301106599');
    expect(html).toContain('BSIT · Year 3');
    expect(html).toContain('1st Semester, S.Y. 2025-2026');
    expect(html).toContain('Departmental Membership Fee');
    expect(html).toContain('Size:</strong> L');
    expect(html).toContain('₱500.00');
    expect(html).toContain('Fully Paid');
    expect(html).toContain('Admin Officer');
    expect(html).toContain('Treasurer Jane');
    expect(html).toContain('Gov John');
  });

  it('should display partial payment badge and remaining balance when not fully paid', async () => {
    await sendTransactionReceiptEmail({
      to: 'student@student.buksu.edu.ph',
      studentName: 'Maria Santos',
      studentID: '2301109999',
      course: 'BSIT',
      year: 2,
      orgName: 'College of Technologies SBO',
      receiptNumber: 'PARTIAL1',
      date: new Date('2026-10-15T10:30:00Z'),
      modeOfPayment: 'gcash',
      semester: '2',
      schoolYear: '2025-2026',
      items: [
        {
          categoryName: 'College Jersey',
          categoryFee: 650,
          amountPaidNow: 300,
          totalPaid: 300,
          balance: 350,
          status: 'Partial',
        },
      ],
      totalAmountPaidNow: 300,
      totalFee: 650,
      totalBalance: 350,
    });

    const mailArgs = sendMailMock.mock.calls[0][0];
    const html = mailArgs.html;

    expect(html).toContain('Partial Payment');
    expect(html).toContain('Remaining Balance:');
    expect(html).toContain('₱350.00');
    expect(html).toContain('₱300.00');
  });

  it('should support other existing email helpers without regression', async () => {
    await sendVerificationEmail('user@buksu.edu.ph', 'https://example.com/verify');
    await sendPaymentRequestStatusEmail(
      'user@buksu.edu.ph',
      'Juan Dela Cruz',
      'T-Shirt',
      'COT SBO',
      500,
      'approved',
    );
    await sendWelcomeCredentialsEmail(
      'admin@buksu.edu.ph',
      'Admin Name',
      '2301100000',
      'Pass123',
      'COT SBO',
      'https://example.com/login',
    );
    await sendForgotPasswordEmail('user@buksu.edu.ph', 'https://example.com/reset');

    expect(sendMailMock).toHaveBeenCalledTimes(4);
  });
});

describe('Transaction Email Service Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(UserModel, 'findOne').mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      }),
    } as any);
  });

  it('should notify student on single transaction record', async () => {
    const mockStudent: any = {
      _id: 'student-id-1',
      studentID: '2301106599',
      firstname: 'Juan',
      lastname: 'Dela Cruz',
      course: 'BSIT',
      year: 3,
      email: '',
    };

    const mockCategory: any = {
      _id: 'category-id-1',
      name: 'College Fee',
      fee: 250,
      organization: {
        name: 'CS SBO',
        governor: 'Gov Alice',
        treasurer: 'Treas Bob',
      },
      details: [],
    };

    const mockTransaction: any = {
      _id: '65f123456789012345678901',
      amount: 250,
      description: 'First payment',
      details: {},
      semester: '1',
      schoolYear: '2025-2026',
    };

    await notifyStudentTransactionRecorded({
      transaction: mockTransaction,
      student: mockStudent,
      category: mockCategory,
      recordedBy: { firstname: 'Cashier', lastname: 'One' } as any,
      amountPaidNow: 250,
      modeOfPayment: 'cash',
      paymentDate: new Date('2026-10-15'),
    });

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const mailArgs = sendMailMock.mock.calls[0][0];
    expect(mailArgs.to).toBe('2301106599@student.buksu.edu.ph');
    expect(mailArgs.html).toContain('College Fee');
    expect(mailArgs.html).toContain('₱250.00');
  });

  it('should notify student on batch transaction record with itemized entries', async () => {
    const mockStudent: any = {
      _id: 'student-id-1',
      studentID: '2301106599',
      firstname: 'Juan',
      lastname: 'Dela Cruz',
      course: 'BSIT',
      year: 3,
      email: '',
    };

    const cat1: any = {
      _id: 'cat-1',
      name: 'Membership Fee',
      fee: 100,
      organization: { name: 'CS SBO', governor: 'Gov', treasurer: 'Treas' },
    };
    const cat2: any = {
      _id: 'cat-2',
      name: 'T-Shirt',
      fee: 300,
      organization: { name: 'CS SBO', governor: 'Gov', treasurer: 'Treas' },
    };

    const tx1: any = { _id: '65f111111111111111111111', amount: 100 };
    const tx2: any = { _id: '65f222222222222222222222', amount: 300 };

    await notifyStudentBatchTransactionsRecorded({
      transactions: [tx1, tx2],
      validatedItems: [
        { category: cat1, amount: 100, detailsObj: {}, isTopUp: false },
        { category: cat2, amount: 300, detailsObj: { size: 'XL' }, isTopUp: false },
      ],
      student: mockStudent,
      recordedBy: { firstname: 'Officer', lastname: 'Jane' } as any,
      modeOfPayment: 'gcash',
      paymentDate: new Date('2026-10-15'),
      semester: '1',
      schoolYear: '2025-2026',
    });

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const mailArgs = sendMailMock.mock.calls[0][0];
    expect(mailArgs.to).toBe('2301106599@student.buksu.edu.ph');
    expect(mailArgs.html).toContain('Membership Fee');
    expect(mailArgs.html).toContain('T-Shirt');
    expect(mailArgs.html).toContain('Size:</strong> XL');
    expect(mailArgs.html).toContain('₱400.00'); // total amount paid
  });

  it('should notify student on transaction amount update (top-up)', async () => {
    const mockStudent: any = {
      _id: 'student-id-1',
      studentID: '2301106599',
      firstname: 'Juan',
      lastname: 'Dela Cruz',
      course: 'BSIT',
      year: 3,
      email: 'juan@custom.com',
    };

    const mockCategory: any = {
      _id: 'cat-1',
      name: 'Org Shirt',
      fee: 500,
      organization: { name: 'CS SBO' },
    };

    const mockTransaction: any = {
      _id: '65f333333333333333333333',
      amount: 500, // now fully paid after adding 200 to existing 300
      semester: '1',
      schoolYear: '2025-2026',
    };

    await notifyStudentTransactionAmountUpdated({
      transaction: mockTransaction,
      category: mockCategory,
      student: mockStudent,
      amountAdded: 200,
      recordedBy: { firstname: 'Admin', lastname: 'User' } as any,
    });

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const mailArgs = sendMailMock.mock.calls[0][0];
    expect(mailArgs.to).toBe('juan@custom.com');
    expect(mailArgs.html).toContain('Org Shirt');
    expect(mailArgs.html).toContain('₱200.00'); // amount paid now
    expect(mailArgs.html).toContain('Fully Paid');
  });
});
