import mongoose from 'mongoose'
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId




export const OrderSchema = new Schema({
    creatorId: { type: ObjectId, ref: 'Account', required: true },
    creatorName: { type: String, required: true },
    notes: { type: String },
    createdOn: { type: Date, required: true, default: Date.now() },
    updatedOn: { type: Date, required: true, default: Date.now() },
    status: { type: String, enum: ['waiting for approval', 'approved', 'processing', 'delivered', 'declined'] },
    labels: [
        {
            qty: { type: Number, required: true },
            labelId: { type: String, required: true },
            textToPut: [
                {
                    name: { type: String },
                    text: { type: String }

                }
            ],
            createdOn: { type: Date, default: Date.now() },
            updatedOn: { type: Date, default: Date.now() }
        }
    ]
})