import { PDFDocument } from "pdf-lib";
import { dbContext } from "../db/DbContext";
import { logger } from "../utils/Logger";
import { PDFTextField } from "pdf-lib";
import { PDFCheckBox } from "pdf-lib";

const fse = require("fs-extra");
const fs = require("fs");
const filePath = require("path");
const upload = require("multer");
const pdfjs = require("pdfjs-dist");
const labelSchema = dbContext.Label;

class LabelsService {
  async findUser(token) {
    const data = await dbContext.Account.findOne({ accessToken: token });
    if (!data) {
      return null;
    } else {
      return data;
    }
  }

  async createLabel(data, catData, subCatData, creator) {
    try {
      let labelData;
      let fields = [];
      let bulkPath;
      if (data.isBulkLabel == true) {
        bulkPath = filePath.join(
          __dirname,
          "..",
          "..",
          "..",
          "gena_2",
          "server",
          "images",
          "bulk"
        );
      }
      if (data.isKanban == true) {
        fields = data.fields;
      }

      const pdfPath = filePath.join(
        __dirname,
        "..",
        "..",
        "..",
        "gena_2",
        "server",
        "images",
        "pdflabels"
      );

      labelData = {
        pdfPath: pdfPath,
        pdfBulkPath: bulkPath,
        fields: fields,
        maxOrderQty: data.maxOrderQty,
        isBulkLabel: data.isBulkLabel,
        unitPack: data.unitPack,
        docNum: data.docNum,
        creatorId: creator,
        categoryName: catData.name,
        categoryId: catData._id,
        subCategoryName: subCatData.name,
        subCategoryId: subCatData._id,
        fileName: data.fileName,
        isKanban: data.isKanban,
        materialTypeId: data.materialTypeId,
        name: data.name,
        bulkFileName: data.bulkFileName,
        isSerial: data.isSerial,
      };
      if (data.isSerial == true) {
        labelData.currentSerialNum = data.currentSerialNum;
        labelData.nextSerialsToPrint = `${data.currentSerialNum} - ${
          data.currentSerialNum + data.unitPack - 1
        }`;
      }
      const newDoc = await dbContext.Label.create(labelData);
      return newDoc;
    } catch (error) {
      logger.error(error);
      return error;
    }
  }

  async updateFileName(id, fileName) {
    try {
      const updatedLabel = await dbContext.Label.findByIdAndUpdate(id, {
        fileName: fileName,
        updateOn: Date.now(),
      });
      return updatedLabel;
    } catch (error) {
      logger.error(error);
      return error;
    }
  }

  /**
   * * Update file data
   * * RELATIONAL DATA DELETION
   * * ONLY RUNS FOR PRINTSHOP & ADMIN USERS
   * @param {String} id
   * @param {labelSchema} data
   * @returns {Object} updated label
   */

  async updateSerialFileData(id, data) {
    try {
      const { fileName, bulkFileName, currentSerialNum, unitPack } = data;
      const serialRange = `${currentSerialNum} - ${
        currentSerialNum + unitPack - 1
      }`;

      const updates = {
        fileName: fileName,
        bulkFileName: bulkFileName,
        currentSerialNum: currentSerialNum,
        nextSerialsToPrint: serialRange,
        unitPack: unitPack,
      };
      const newLabel = await dbContext.Label.findByIdAndUpdate(id, updates, {
        returnOriginal: false,
      });

      return newLabel;
    } catch (error) {
      logger.error(error);
      return error;
    }
  }

  async removeLabel(id) {
    const label = await dbContext.Label.findById(id);
    if (!label) {
      return Promise.resolve(404);
    } else {
      let path = filePath.join(
        __dirname,
        "..",
        "..",
        "..",
        "gena_2",
        "server",
        "images",
        "pdflabels"
      );
      let bulkPath;
      if (label.isBulkLabel == true) {
        bulkPath = filePath.join(
          __dirname,
          "..",
          "..",
          "..",
          "gena_2",
          "server",
          "images",
          "bulk",
          `${label.name}`
        );
        await fs.unlink(bulkPath, (err) => {
          if (err) {
            console.error(err);
            return Promise.resolve(401);
          }
          return Promise.resolve(200);
        });
      }
      await fs.unlink(path, (err) => {
        if (err) {
          console.error(err);
          return Promise.resolve(401);
        }
        return Promise.resolve(200);
      });
      await dbContext.Order.updateMany(
        {},
        { $pull: { labels: { labelId: id } } }
      );
      await dbContext.Order.deleteMany({ labels: [] });
      await dbContext.Label.findByIdAndDelete(id);

      return Promise.resolve(id);
    }
  }

  async getLabelsInCats(catId, subCatId) {
    try {
      const data = await dbContext.Label.find({
        categoryId: catId,
        subCategoryId: subCatId,
      });
      return Promise.resolve(data);
    } catch (error) {
      logger.error(error);
      return error;
    }
  }

  async searchLabel(data, id) {
    try {
      // gets documents of categories users have access to
      const categoryIds = await dbContext.Category.find({
        visibility: {
          $elemMatch: {
            $eq: id,
          },
        },
      });
      const foundData = await dbContext.Label.find({
        $and: [
          {
            $or: [
              { fileName: { $regex: new RegExp(data, "i") } },
              { docNum: { $regex: new RegExp(data, "i") } },
              { categoryName: { $regex: new RegExp(data, "i") } },
              { subCategoryName: { $regex: new RegExp(data, "i") } },
              { name: { $regex: new RegExp(data, "i") } },
            ],
          },
          {
            categoryId: {
              $in: categoryIds,
            },
          },
        ],
      });
      const seenDocNums = {};
      let searchData = foundData.filter((item) => {
        if (!seenDocNums.hasOwnProperty(item.docNum)) {
          seenDocNums[item.docNum] = true; // Mark this docNum as seen
          return true; // Include the item in the result
        }
        return false; // Skip duplicates
      });
      searchData = searchData.slice(0, 25);
      return searchData;
    } catch (error) {
      logger.error(error);
      return error;
    }
  }

  async getFieldsFromLabel(buffer) {
    try {
      const pdfDoc = await PDFDocument.load(new Uint8Array(buffer));
      const form = pdfDoc.getForm();
      const fieldNames = form.getFields().map((field) => field.getName());
      const types = [];
      const labelObjects = [];
      for (let i = 0; i < fieldNames.length; i++) {
        const field = fieldNames[i];
        try {
          const checkbox = form.getCheckBox(field);
          types.push("checkbox");
        } catch (error) {
          types.push("text");
        }
      }
      for (let i = 0; i < fieldNames.length; i++) {
        let max;
        const name = fieldNames[i];
        const type = types[i];
        let obj = {
          name: name,
          type: type,
        };
        labelObjects.push(obj);
      }
      return labelObjects;
    } catch (error) {
      logger.error(error);
      return error;
    }
  }

  async getLabelById(id) {
    const label = dbContext.Label.findById(id);
    return label;
  }
}

export const labelsService = new LabelsService();
