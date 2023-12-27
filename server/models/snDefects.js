import { Schema } from "mongoose";
const ObjectId = Schema.Types.ObjectId;

export const snDefects = new Schema({
    labelId: {type: ObjectId, ref: 'Label'},
    defectLogs: [
        {
            orderId: { type: ObjectId, ref: 'Order', required: true},
            sn: {type: Array},
            comment: {type: String},
            docNum: {type: String},
            uploadedOn: {type: Date, required: true, default: Date.now},
            updatedOn: {type: Date, required: true, default: Date.now}
        },
    ],
    createdOn: {type: Date, required: true, default: Date.now},
    updatedOn: {type: Date, required: true, default: Date.now}
})

