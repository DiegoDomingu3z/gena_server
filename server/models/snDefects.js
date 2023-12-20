import { Schema } from "mongoose";
const ObjectId = Schema.Types.ObjectId;

export const snDefects = new Schema({
    docNum: {type: ObjectId, ref: 'Label'},
    defectLogs: [
        {
            orderId: { type: ObjectId, ref: 'Order', required: true},
            sn: {type: Array},
            date: {type: Date},
            comment: {type: String}
        },
    ]
})

