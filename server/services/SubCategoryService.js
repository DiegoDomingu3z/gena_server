import { dbContext } from "../db/DbContext";
import { logger } from "../utils/Logger";
const fs = require("fs");
const util = require("util");
const mkdir = util.promisify(fs.mkdir);
const rename = util.promisify(fs.rename);
const rmdir = util.promisify(fs.rm);
const filePath = require("path");
class SubCategoryService {
  /**
* CREATE SUBCATEGORY
* Brings in users token, categoryId, and sub-category data to be sanatized and inputed into DB
* @param {String} token
 @param {ObjectId} catId 
 @param {Object} data 
*/

  async createSubCat(token, catId, data) {
    try {
      const user = await dbContext.Account.findOne({ accessToken: token });
      const category = await dbContext.Category.findById(catId);
      if (!category) {
        logger.log("CATEGORY DOES NOT EXIST");
        return 404;
      } else {
        if (!user) {
          return 404;
        } else if (
          user.privileges != "admin" &&
          user.privileges != "printshop"
        ) {
          return 401;
        } else {
          const path = await mkdir(`${category.path}/${data.name}`, {
            recursive: true,
          });
          const bulkPath = await mkdir(`${category.bulkPath}/${data.name}`, {
            recursive: true,
          });
          const cat = await dbContext.SubCategory.create({
            name: data.name,
            creatorId: user._id,
            path: `${category.path}`,
            bulkPath: category.bulkPath,
            categoryId: catId,
          });
          // changed bulkPath from bulkPath
          return cat;
        }
      }
    } catch (error) {
      logger.error(error);
      return error;
    }
  }

  async getAll() {
    try {
      const data = await dbContext.SubCategory.find();
      if (!data) {
        return Promise.resolve(404);
      } else {
        return data;
      }
    } catch (error) {
      logger.error(error);
      return error;
    }
  }

  async getAllInCategory(id) {
    try {
      const subCats = await dbContext.SubCategory.find({ categoryId: id });
      if (!subCats) {
        return Promise.resolve(404);
      } else {
        return subCats;
      }
    } catch (error) {
      logger.error(error);
      return error;
    }
  }

  async getById(id) {
    try {
      const cat = await dbContext.SubCategory.findById(id);
      if (!cat) {
        return Promise.resolve(404);
      } else {
        return cat;
      }
    } catch (error) {
      logger.error(error);
      return error;
    }
  }

  async updateSubCat(token, id, data) {
    try {
      const user = await dbContext.Account.findOne({ accessToken: token });
      if (user.privileges != "admin") {
        return Promise.resolve(401);
      } else {
        const subCat = await dbContext.SubCategory.findById(id);
        if (!subCat) {
          return Promise.resolve(400);
        } else {
          data["updatedOn"] = Date.now();
          const updatedDoc = await dbContext.SubCategory.findByIdAndUpdate(
            id,
            data
          );
          const doc = await dbContext.SubCategory.findById(id);
          const updatedLabel = await dbContext.Label.updateMany(
            { subCategoryId: id },
            { $set: { subCategoryName: doc.name } }
          );
          const category = await dbContext.Category.findById(doc.categoryId);
          const pathToUpdated = `${doc.path}/${subCat.name}`;
          const pathToUpdatedBulk = `${doc.bulkPath}/${subCat.name}`;
          const newPath = filePath.join(
            __dirname,
            "..",
            "..",
            "..",
            "gena_2",
            "server",
            "images",
            "pdflabels",
            `${category.name}`,
            `${doc.name}`
          );
          const newBulkPath = filePath.join(
            __dirname,
            "..",
            "..",
            "..",
            "gena_2",
            "server",
            "images",
            "bulk",
            `${category.name}`,
            `${doc.name}`
          );
          // const newPath = `../../../repos/inventive/gena_2/public/images/pdflabels/${category.name}/${doc.name}`
          // const newBulkPath = `../../../repos/inventive/gena_2/public/images/bulk/${category.name}/${doc.name}`
          await rename(pathToUpdated, newPath);
          await rename(pathToUpdatedBulk, newBulkPath);
          return doc;
        }
      }
    } catch (error) {
      logger.error(error);
      return error;
    }
  }

  async removeSubCategory(id, token) {
    try {
      const user = await dbContext.Account.findOne({ accessToken: token });
      if (!user) {
        return Promise.resolve(403);
      } else if (user.privileges != "admin" && user.privileges != "printshop") {
        return Promise.resolve(403);
      } else {
        const subCategory = await dbContext.SubCategory.findById(id);
        const path = `${subCategory.path}/${subCategory.name}`;
        const bulkPath = `${subCategory.bulkPath}/${subCategory.name}`;
        await rmdir(path, { recursive: true });
        await rmdir(bulkPath, { recursive: true });
        const removeSubCategory = await dbContext.SubCategory.findByIdAndDelete(
          id
        );
        const removedLabels = await dbContext.Label.deleteMany({
          subCategoryId: id,
        });
        return removeSubCategory;
      }
    } catch (error) {
      logger.error(error);
      return error;
    }
  }
}

export const subCategoryService = new SubCategoryService();
