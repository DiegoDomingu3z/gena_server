import mongoose from 'mongoose'
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId



export const DepartmentSchema = new Schema({
    name: { type: String, required: true },
    createdOn: { type: Date, default: Date.now() },
    updatedOn: { type: Date, default: Date.now() },
})