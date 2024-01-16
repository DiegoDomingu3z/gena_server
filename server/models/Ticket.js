import mongoose from "mongoose";
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

export const TicketSchema = new Schema({
  creatorId: { type: ObjectId, ref: "Account", required: true },
  creatorName: { type: String, required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  priority: { type: String, enum: ["Low", "Medium", "High"], required: true },
  status: {
    type: String,
    enum: ["In queue", "In progress", "Completed"],
    default: "In queue",
  },
  claimedBy: { type: String },
  completedBy: { type: String },
  createdOn: { type: Date, required: true, default: Date.now },
  updatedOn: { type: Date, required: true, default: Date.now },
});
