import mongoose from 'mongoose';

const Schema = mongoose.Schema;

export interface IOrganization extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  governor: string;
  viceGovernor: string;
  treasurer: string;
  auditor: string;
  createdAt: Date;
  updatedAt: Date;
}

export const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    governor: { type: String, required: true },
    viceGovernor: { type: String, required: true },
    treasurer: { type: String, required: true },
    auditor: { type: String, required: true },
  },
  { timestamps: true },
);

const OrganizationModel = mongoose.model('Organization', OrganizationSchema);
export default OrganizationModel;
