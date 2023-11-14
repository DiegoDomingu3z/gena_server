import mongoose from "mongoose";
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

export const CategorySchema = new Schema({
  name: { type: String, required: true },
  path: { type: String, required: true },
  bulkPath: { type: String, required: true },
  visibility: { type: [String], required: true },
  creatorId: { type: ObjectId, ref: "Account", required: true },
  createdOn: { type: Date, required: true, default: Date.now() },
  updatedOn: { type: String, required: true, default: Date.now() },
});
