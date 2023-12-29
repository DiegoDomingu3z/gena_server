import mongoose from "mongoose";
import { dbContext } from "../db/DbContext";
import { logger } from "../utils/Logger"
// import { mkConfig, generateCsv, asString } from "export-to-csv";
// import { writeFile } from "node:fs";
// import { Buffer } from "node:buffer";

const createCsvWriter = require('csv-writer').createObjectCsvWriter;

class FilterService {

    async filterLabelDefects(query){
        try {
            const dateFrom = new Date(query.dateFrom)
            const dateTo = new Date(query.dateTo)
            let timestamp;
            switch (query.timestamp) {
              case 'createdOn':
                timestamp = [
                  { $gte: ["$$log.uploadedOn", dateFrom] },
                  { $lte: ["$$log.uploadedOn", dateTo] }
                ]
                break;
              case 'updatedOn':
                 timestamp = [
                  { $gte: ["$$log.updatedOn", dateFrom] },
                  { $lte: ["$$log.updatedOn", dateTo] }
                 ]
                break;
            }
            const pipeline = [
              
                {
                  $project: {
                    defectLogs: {
                      $filter: {
                        input: "$defectLogs",
                        as: "log",
                        cond: {
                          $and: timestamp
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
              
            ]
            if (query.labelId != '*') {
              pipeline.unshift({
                $match: {
                  labelId: mongoose.Types.ObjectId(query.labelId)
                }
              })
            }
            logger.log(pipeline)
              const data2 = await dbContext.Defects.aggregate(pipeline);
                   
              logger.log(data2)
              return data2
            } catch (error) {
            logger.error(error)
            return error
        }
    }


}


export const filterService = new FilterService()


