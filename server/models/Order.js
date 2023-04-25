import mongoose from 'mongoose'
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId




export const OrderSchema = new Schema({
    creatorId: { type: ObjectId, ref: 'Account', required: true },
    creatorName: { type: String, required: true },
    notes: { type: String, required: true },
    createdOn: { type: Date, required: true, default: Date.now() },
    updatedOn: { type: Date, required: true, default: Date.now() },
    status: { type: String, enum: ['waiting for approval', 'processing', 'printed'] },
    labels: [
        {
            pathToPrint: { type: String, required: true }
        }
    ]
})