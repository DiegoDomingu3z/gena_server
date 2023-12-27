import { dbContext } from "../db/DbContext";
import { logger } from "../utils/Logger"

class FilterService {

    async filterLabelDefects(query){
        try {
            const dateFrom = new Date(query.dateFrom)
            const dateTo = new Date(query.dateTo)
              const data2 = await dbContext.Defects.aggregate([
                {
                  $project: {
                    defectLogs: {
                      $filter: {
                        input: "$defectLogs",
                        as: "log",
                        cond: {
                          $and: [
                            { $gte: ["$$log.uploadedOn", dateFrom] },
                            { $lte: ["$$log.uploadedOn", dateTo] }
                          ]
                        }
                      }
                    }
                  }
                },
                {
                  $unwind: "$defectLogs"
                },
                {
                  $lookup: {
                    from: "orders", 
                    localField: "defectLogs.orderId",
                    foreignField: "_id",
                    as: "defectLogs.orderInformation"
                  }
                },
                {
                    $unwind: "$defectLogs.orderInformation"
                  },
                  {
                    $project: {
                      "defectLogs.orderInformation.creatorName": 1, 
                      "defectLogs.orderInformation.creatorId": 1,
                      "defectLogs.orderInformation.createdOn": 1,
                      "defectLogs.orderId": 1,
                      "defectLogs.sn": 1,
                      "defectLogs.comment": 1,
                      "defectLogs.docNum": 1,
                      "defectLogs._id": 1,
                      "defectLogs.uploadedOn": 1,
                      "defectLogs.updatedOn": 1,

                    }
                  },
                {
                  $group: {
                    _id: "$_id",
                    defectLogs: { $push: "$defectLogs" }
                  }
                }
              ]);
                   
              logger.log(data2)
              return data2
            } catch (error) {
            logger.error(error)
            return error
        }
    }

}


export const filterService = new FilterService()


