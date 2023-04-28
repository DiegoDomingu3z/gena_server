import mongoose from 'mongoose'
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

export const MaterialSchema = new Schema({
    name: { type: String, required: true },
    createdOn: { type: Date, required: true, default: Date.now() },
    updatedOn: { type: Date, required: true, default: Date.now() },
    creatorId: { type: ObjectId, required: true, ref: 'Account' }
})