import { dbContext } from "../db/DbContext"
import { logger } from "../utils/Logger"

class DefectService{


    async getSerialLabels(){
        try {
            const data = await dbContext.Label.find({ isSerial: true }).select('_id docNum');
            return Promise.resolve(data)
        } catch (error) {
            logger.error(error)
            return error
        }
    }

    async defectSubmission(token, data){
        try {
            const user = await dbContext.Account.findOne({accessToken: token}).select('privileges')
            if (user.privileges != 'printshop' && user.privileges != 'admin') {
                return Promise.resolve(403)
            } else {
                // check if the defect Parent Doc already exists or not
                const exists = await dbContext.Defects.findOne({labelId: data.labelId})
                if (!exists) {
                    const sanitizedData = {
                        labelId: data.labelId,
                        defectLogs: [
                            {
                                orderId: data.orderId,
                                sn: data.sn,
                                comment: data.comment,
                                docNum: data.docNum
                            }
                        ]
                    }
                    const createdData = await dbContext.Defects.create(sanitizedData)
                    return Promise.resolve(createdData)
                } else {
                    const filter = {labelId: data.labelId}
                    const update = { $push: { defectLogs: {
                        orderId: data.orderId,
                        sn: data.sn,
                        comment: data.comment,
                        docNum: data.docNum
                    } }, $set: { updatedOn: new Date()} }
                    const options = { returnOriginal: false };
                    const updatedDoc = await dbContext.Defects.findOneAndUpdate(filter, update, options)
                    return Promise.resolve(updatedDoc)
                }
            }
        } catch (error) {
            logger.error(error)
            return error
        }
    }
    

}

export const defectService = new DefectService()