import { dbContext } from "../db/DbContext";
import { logger } from "../utils/Logger";

class MaterialService {
  async createMaterial(data, userId) {
    const sanatizedData = {
      creatorId: userId,
      name: data.name,
    };

    const newMaterial = await dbContext.Material.create(sanatizedData);
    return newMaterial;
  }

  async updateMaterial(data, userId) {
    try {
      const sanatizedData = {
        creatorId: userId,
        name: data.name,
      };

      const query = {
        name: data.categoryToUpdate,
      };
      const update = {
        $set: {
          name: data.name,
        },
      };
      const options = {
        returnOriginal: false,
      };

      const updatedMaterial = await dbContext.Material.findOneAndUpdate(
        query,
        update,
        options
      );
      return updatedMaterial;
    } catch (error) {
      logger.error(error);
      return error;
    }
  }

  async getAllMaterials(token) {
    try {
      const user = await dbContext.Account.findOne({ accessToken: token });
      if (!user) {
        return Promise.resolve(400);
      } else {
        const data = await dbContext.Material.find();
        return Promise.resolve(data);
      }
    } catch (error) {
      logger.error(error);
      return error;
    }
  }
}

export const materialService = new MaterialService();
