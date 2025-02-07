import mongoose from "mongoose";
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

export const AccountSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  userName: { type: String, required: true, unique: true },
  password: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  departmentId: { type: ObjectId, ref: "Department", required: true },
  teamLead: { type: String },
  groupLead: { type: String },
  groupLeadId: { type: String },
  teamLeadId: { type: String },
  privileges: {
    type: String,
    enum: ["admin", "group-lead", "team-lead", "team-member", "printshop"],
    required: true,
    default: "team-member",
  },
  email: { type: String },
  companyName: { type: String, enum: ["IG", "IWS"] },
  orderCount: { type: Number },
  accessToken: { type: String },
  createdAt: { type: Date, default: Date.now() },
  updatedAt: { type: Date, default: Date.now() },
});
