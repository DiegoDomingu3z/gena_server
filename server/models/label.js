import mongoose from 'mongoose'
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId



export const labelSchema = new Schema({
    pdfPath: { type: String, required: true },
    pdfBulkPath: { type: String, },
    fields: [{
        name: { type: String, required: true },
        type: { type: String, required: true, enum: ["text", "number", "checkbox"] }
    }],
    maxOrderQty: { type: Number, required: true },
    isBulkLabel: { type: Boolean, required: true },
    unitPack: { type: Number, required: true, default: 1 },
    docNum: { type: String, required: true },
    creatorId: { type: ObjectId, ref: 'Account', required: true },
    createdOn: { type: Date, required: true, default: Date.now() },
    updatedOn: { type: Date, required: true, default: Date.now() },
    categoryId: { type: ObjectId, ref: 'Category', required: true },
    subCategoryId: { type: ObjectId, ref: 'SubCategory', required: true }
})

