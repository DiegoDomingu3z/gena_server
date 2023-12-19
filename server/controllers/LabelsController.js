import { dbContext } from "../db/DbContext";
import { labelsService } from "../services/LabelsService";
import BaseController from "../utils/BaseController";
import { logger } from "../utils/Logger";
import multer from "multer";
const { promisify } = require("util");
const pipeline = promisify(require("stream").pipeline);
const fs = require("fs");
const upload = multer();
const filePath = require("path");

export class LabelsController extends BaseController {
  constructor() {
    super("api/upload");
    this.router
      // ///////////////// MAKE THESE CALL BOTH IN FRONT END
      .post("/pdf/cat/:catId/subCat/:subCatId", this.uploadPDF)
      .post("/label/cat/:catId/subCat/:subCatId", this.createLabel)
      .put("/update-label-file/:id", this.updateFile)
      .put("/update-label-db/:id", this.updateSerialFileData)
      .delete("/label/delete/:id", this.removeLabel)
      .get(
        "/get/category/:categoryId/subCategory/:subCatId",
        this.getLabelsInCats
      )
      .get("/search", this.searchLabel)
      .post("/find-pdf-fields", this.getFieldsFromLabel)
      .get("label/byId/:id", this.getLabelById);
  }

  /**
   * * Upload PDF
   * * RELATIONAL DATA DELETION
   * ! ONLY RUNS FOR PRINTSHOP & ADMIN USERS
   * @param {String} token
   * @param {ObjectId} CategoryId
   * @param {ObjectId} SubCategoryId
   * @param {Array_OF_Buffer} PDF_BUFFER
   * @returns {Object} created department
   */
  async uploadPDF(req, res, next) {
    try {
      const catId = req.params.catId;
      const subCatId = req.params.subCatId;
      const catData = await dbContext.Category.findById(catId);
      const subCatData = await dbContext.SubCategory.findById(subCatId);
      const token = req.header("Authorization");
      const creator = await labelsService.findUser(token);
      if (creator == null) {
        res.status(404).send("USER IS NOT FOUND TO DO THIS ACTION");
      } else if (
        creator.privileges != "admin" &&
        creator.privileges != "printshop"
      ) {
        res.status(403).send("YOU DO NOT HAVE PERMISSION TO DO THIS");
      } else {
        if (!catData || !subCatData) {
          res.status(404).send("CATEGORY OR SUBCATEGORY DOES NOT EXISTS");
        } else {
          const catName = catData.name;
          const subCatName = subCatData.name;
          upload.array("pdf", 2)(req, res, async (err) => {
            if (err) {
              return next(err);
            } else {
              const files = req.files;
              let path;
              for (let i = 0; i < files.length; i++) {
                const fileToPrint = files[i];
                const fileName = await fileToPrint.originalname;
                if (i == 0) {
                  path = filePath.join(
                    __dirname,
                    "..",
                    "..",
                    "..",
                    "gena_2",
                    "server",
                    "images",
                    "pdflabels",
                    `${catName}`,
                    `${subCatName}`,
                    `${fileName}`
                  );
                } else {
                  //* IF THERE was more than 1 file submitted the file2 means it s a bulk file
                  //* WILL STORE IN BULK PATH FOLDER
                  path = filePath.join(
                    __dirname,
                    "..",
                    "..",
                    "..",
                    "gena_2",
                    "server",
                    "images",
                    "bulk",
                    `${catName}`,
                    `${subCatName}`,
                    `${fileName}`
                  );
                }
                const pdfBuffer = Buffer.from(fileToPrint.buffer);
                await fs.promises.writeFile(path, pdfBuffer);
              }
              res.status(200).send("PDF CREATED");
            }
          });
        }
      }
    } catch (error) {
      logger.error(error);
      next();
    }
  }

  /**
   * * Create Label
   * * THIS RUNS WITH API ABOVE (STORES DATA IN DATABASE)
   * ! ONLY RUNS FOR PRINTSHOP & ADMIN USERS
   * @param {String} token
   * @param {ObjectId} CategoryId
   * @param {ObjectId} SubCategoryId
   * @param {Object} data
   * @returns {Object} Created Label
   */

  async createLabel(req, res, next) {
    try {
      const token = req.header("Authorization");
      const data = req.body;
      const creator = await labelsService.findUser(token);
      if (creator == null) {
        res.status(403).send("USER IS NOT FOUND TO DO THIS ACTION");
      } else {
        const catId = req.params.catId;
        const subCatId = req.params.subCatId;
        const catData = await dbContext.Category.findById(catId);
        const subCatData = await dbContext.SubCategory.findById(subCatId);
        if (!catData || !subCatData) {
          res.status(404).send("CATEGORY OR SUBCATEGORY DOES NOT EXISTS");
        } else {
          const newDoc = await labelsService.createLabel(
            data,
            catData,
            subCatData,
            creator
          );
          res.status(200).send(newDoc);
        }
      }
    } catch (error) {
      logger.error(error);
      next();
    }
  }

  /**
   * * Update File
   * ! ONLY RUNS FOR PRINTSHOP & ADMIN USERS
   * ! CURRENTLY NOT BEING USED
   * @param {String} token
   * @param {ObjectId} labelId
   * @returns {Object} updated label
   */

  async updateFile(req, res, next) {
    try {
      const token = req.header("Authorization");
      const user = await dbContext.Account.findOne({ accessToken: token });
      if (!user) {
        res.status(404).send("USER IS NOT FOUND TO DO THIS ACTION");
      } else if (user.privileges != "admin" || user.privileges != "printshop") {
        res.status(403).send("YOU DO NOT HAVE PERMISSION TO DO THIS");
      } else {
        const labelId = req.param.id;
        const label = await dbContext.Label.findById(labelId);
        if (!label) {
          res.status(404).send({ ERROR: "LABEL DOES NOT EXISTS" });
        } else {
          const oldFilePath = `${label.path}/${label.categoryName}/${label.subCategoryName}/${label.fileName}`;
          await fs.unlink(oldFilePath, (err) => {
            if (err) {
              console.error(err);
              return;
            }
          });
          upload.single("pdf")(req, res, async (err) => {
            if (err) {
              return next(err);
            } else {
              const fileName = await req.file.originalname;
              const pdfBuffer = Buffer.from(req.file.buffer);
              const path = `../../../repos/inventive/gena_2/public/images/pdflabels/${catName}/${subCatName}/${fileName}`;
              await fs.promises.writeFile(path, pdfBuffer);
              const newLabel = await labelsService.updateFileName(
                labelId,
                fileName
              );
              res.status(200).send("PDF CREATED");
            }
          });
        }
      }
    } catch (error) {
      logger.error(error);
      next();
    }
  }

  /**
   * * Update file data
   * * RELATIONAL DATA DELETION
   * ! ONLY RUNS FOR PRINTSHOP & ADMIN USERS
   * ! CURRENTLY NOT BEING USED
   * @param {String} token
   * @param {Object} data
   * @returns {Object} updated label
   */

  async updateSerialFileData(req, res, next) {
    try {
      const token = req.header("Authorization");
      const user = await dbContext.Account.findOne({ accessToken: token });
      if (!user) {
        res.status(404).send("USER IS NOT FOUND TO DO THIS ACTION");
      } else {
        const labelId = req.params.id;
        const data = req.body;
        const updatedDoc = await labelsService.updateSerialFileData(
          labelId,
          data
        );
        if (updatedDoc == 404) {
          res.status(404).send("Label Not Found");
        } else {
          res.status(200).send(updatedDoc);
        }
      }
    } catch (error) {
      logger.error(error);
      next();
    }
  }

  /**
   * * Remove label
   * * RELATIONAL DATA DELETION
   * ! ONLY RUNS FOR PRINTSHOP & ADMIN USERS
   * ! NEEDS AUTH TOKEN TO RUN
   * @param {String} token
   * @param {ObjectId} labelId
   * @returns {Object} deleted label
   */

  async removeLabel(req, res, next) {
    try {
      const labelId = req.params.id;
      const token = req.header("Authorization");
      const user = await dbContext.Account.findOne({ accessToken: token });
      if (!user) {
        res.status(404).send("USER IS NOT FOUND TO DO THIS ACTION");
      } else if (user.privileges != "admin" && user.privileges != "printshop") {
        res.status(403).send("YOU DO NOT HAVE PERMISSION TO DO THIS");
      } else {
        const data = await labelsService.removeLabel(labelId);
        if (data == 404) {
          res.status(404).send("Label Not Found");
        } else if (data == 401) {
          res.status(401).send("Could not delete file");
        } else {
          res.status(200).send(data);
        }
      }
    } catch (error) {
      logger.error(error);
      next();
    }
  }

  async getLabelsInCats(req, res, next) {
    try {
      const catId = req.params.categoryId;
      const subCatId = req.params.subCatId;
      const data = await labelsService.getLabelsInCats(catId, subCatId);
      res.status(200).send(data);
    } catch (error) {
      logger.error(error);
      next();
    }
  }

  async searchLabel(req, res, next) {
    try {
      const departmentId = req.header("Authorization");
      const { q } = req.query;
      const foundData = await labelsService.searchLabel(q, departmentId);
      res.status(200).send(foundData);
    } catch (error) {
      logger.error(error);
      next();
    }
  }

  async getFieldsFromLabel(req, res, next) {
    try {
      logger.log("Yo");
      upload.array("pdf", 2)(req, res, async (err) => {
        if (err) {
          return next(err);
        } else {
          const files = req.files;
          const buffer = [];
          for (let i = 0; i < files.length; i++) {
            const fileToPrint = files[i];
            const pdfBuffer = Buffer.from(fileToPrint.buffer);
            buffer.push(pdfBuffer);
          }
          const fields = await labelsService.getFieldsFromLabel(buffer[0]);
          res.status(200).send(fields);
        }
      });
    } catch (error) {
      logger.error(error);
      next();
    }
  }

  async getLabelById(req, res, next) {
    try {
      const id = req.params.id;
      const label = labelsService.getLabelById(id);
      res.status(200).send(label);
    } catch (error) {
      logger.error(error);
      next();
    }
  }
}
