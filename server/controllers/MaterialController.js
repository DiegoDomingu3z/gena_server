import { dbContext } from "../db/DbContext";
import { materialService } from "../services/MaterialService";
import BaseController from "../utils/BaseController";
import { logger } from "../utils/Logger";

export class MaterialController extends BaseController {
  constructor() {
    super("api/materials");
    this.router
      .post("/create", this.createMaterial)
      .post("/update", this.updateMaterial)
      .get("/getAll", this.getAllMaterials);
  }

  async createMaterial(req, res, next) {
    try {
      const token = req.header("Authorization");
      const user = await dbContext.Account.findOne({ accessToken: token });
      if (user.privileges != "admin" && user.privileges != "printshop") {
        res.status(401).send("FORBIDDEN");
      } else {
        const data = req.body;
        const newMaterial = await materialService.createMaterial(
          data,
          user._id
        );
        res.status(200).send(newMaterial);
      }
    } catch (error) {
      logger.log(error);
      next(error);
    }
  }

  async updateMaterial(req, res, next) {
    try {
      const token = req.header("Authorization");
      const user = await dbContext.Account.findOne({ accessToken: token });
      if (user.privileges != "admin" && user.privileges != "printshop") {
        res.status(401).send("FORBIDDEN");
      } else {
        const data = req.body;
        const updatedMaterial = await materialService.updateMaterial(
          data,
          user._id
        );
        res.status(200).send(updatedMaterial);
      }
    } catch (error) {
      logger.log(error);
      next(error);
    }
  }

  async getAllMaterials(req, res, next) {
    try {
      const token = req.header("Authorization");
      const data = await materialService.getAllMaterials(token);
      if (data == 400) {
        res.status(400).send("NO USER FOUND");
      } else {
        res.status(200).send(data);
      }
    } catch (error) {
      logger.log(error);
      next(error);
    }
  }
}
