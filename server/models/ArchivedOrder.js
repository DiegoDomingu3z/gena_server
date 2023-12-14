import mongoose from "mongoose";
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

export const ArchivedOrderSchema = new Schema({
  orderId: { type: ObjectId, ref: "Order", required: true },
  archivedOn: { type: Date, required: true, default: Date.now },
  archivePath: { type: String, required: true },
  creatorName: { type: String, required: true },
  notes: { type: String },
  orderName: { type: String },
  orderCreatedOn: { type: Date, required: true },
  labels: [
    {
      qty: { type: Number, required: true },
      labelId: { type: String, required: true },
      textToPut: [
        {
          name: { type: String },
          text: { type: String },
        },
      ],
      serialRange: { type: String },
    },
  ],
  pickedUpBy: { type: String },
});
