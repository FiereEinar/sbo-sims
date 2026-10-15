import { startCase } from 'lodash';
import { IStudent } from '../models/student.model';
import { ICategory } from '../models/category.model';
import { ITransaction } from '../models/transaction.model';
import { IUser } from '../models/user.model';
import { IOrganization } from '../models/organization.model';
import { resolveStudentEmail } from '../utils/student';
import {
  sendTransactionReceiptEmail,
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
}

export interface SendUpdateAmountReceiptParams {
  transaction: ITransaction;
  category: ICategory;
  student: IStudent;
  amountAdded: number;
  recordedBy?: IUser;
  organization?: IOrganization;
}

/**
 * Sends a real transaction receipt email for a single transaction (creation or top-up).
 * Non-blocking, catches errors safely so transaction creation is never interrupted.
 */
export const notifyStudentTransactionRecorded = async ({
  transaction,
  student,
  category,
  recordedBy,
  amountPaidNow,
  modeOfPayment,
  paymentDate,
}: SendSingleTransactionReceiptParams): Promise<void> => {
  try {
    const studentEmail = await resolveStudentEmail(student);

    const studentName = startCase(
      `${student.firstname} ${student.middlename ?? ''} ${student.lastname}`.trim(),
    );

    const org = (category.organization as any) || {};
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
      amountPaidNow,
      totalPaid,
      balance,
      status,
      description: transaction.description,
      details: transaction.details,
    };

    await sendTransactionReceiptEmail({
      to: studentEmail,
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
}: SendBatchTransactionReceiptParams): Promise<void> => {
  try {
    const studentEmail = await resolveStudentEmail(student);

    const studentName = startCase(
      `${student.firstname} ${student.middlename ?? ''} ${student.lastname}`.trim(),
    );

    const firstOrg = (validatedItems[0]?.category?.organization as any) || {};
    const orgName = firstOrg.name || 'Student Body Organization';
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

    await sendTransactionReceiptEmail({
      to: studentEmail,
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
 */
export const notifyStudentTransactionAmountUpdated = async ({
  transaction,
  category,
  student,
  amountAdded,
  recordedBy,
  organization,
}: SendUpdateAmountReceiptParams): Promise<void> => {
  try {
    const studentEmail = await resolveStudentEmail(student);

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

    await sendTransactionReceiptEmail({
      to: studentEmail,
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
    });
  } catch (error) {
    console.error(
      `[Receipt Email] Failed to send amount update receipt for transaction ${transaction._id}:`,
      error,
    );
  }
};
