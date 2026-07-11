import mongoose from 'mongoose';
import { IStudent } from './student.model';
import { IOrganization } from './organization.model';
import { ICategory } from './category.model';
import { ITransaction } from './transaction.model';

const Schema = mongoose.Schema;

export type PaymentRequestStatus = 'pending' | 'approved' | 'rejected';
export type ModeOfPayment = 'cash' | 'gcash';

export interface IPaymentRequest extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  student: IStudent;
  organization: IOrganization;
  category: ICategory;
  amount: number;
  modeOfPayment: ModeOfPayment;
  referenceNumber?: string;
  receiptImage?: string;
  status: PaymentRequestStatus;
  remarks?: string;
  transaction?: ITransaction;
  semester: string;
  schoolYear: string;
  createdAt: Date;
  updatedAt: Date;
}

export const PaymentRequestSchema = new Schema<IPaymentRequest>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    amount: { type: Number, required: true },
    modeOfPayment: { type: String, enum: ['cash', 'gcash'], default: 'cash' },
    referenceNumber: { type: String, required: false },
    receiptImage: { type: String, required: false },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    remarks: { type: String, required: false },
    transaction: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
      required: false,
    },
    semester: { type: String, enum: ['1', '2'], required: true },
    schoolYear: { type: String, required: true },
  },
  { timestamps: true },
);

const PaymentRequestModel = mongoose.model(
  'PaymentRequest',
  PaymentRequestSchema,
);
export default PaymentRequestModel;
