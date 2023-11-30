import mongoose from "mongoose";
import { dbContext } from "../db/DbContext";
import { logger } from "../utils/Logger";
import { emailService } from "./EmailService";
const fs = require("fs");
const filePath = require("path");

class OrderService {
  async createOrder(token, data) {
    try {
      const user = await this.checkIfUserExists(token);
      let needsApproval = [];
      let status;
      if (user == 400) {
        return Promise.resolve(400);
      } else {
        for (let i = 0; i < data.labels.length; i++) {
          const label = data.labels[i];
          const check = await dbContext.Label.findById(label.labelId);
          if (check.isBulkLabel != true) {
            needsApproval.push(label._id);
          }
          if (check.fields.length > 1) {
            if (check.fields[0].type == "checkbox") {
              let sanitizedText = [];
              for (let i = 0; i < check.fields.length; i++) {
                const obj = label.textToPut[i];
                if (obj.text == "") {
                  obj.text = "false";
                }
                sanitizedText.push(obj);
              }
              data.labels[i].textToPut = sanitizedText;
            }
          }
        }
        if (needsApproval.length > 0) {
          status = "waiting for approval";
        } else {
          status = "approved";
        }
        if (user.privileges == "group-lead") {
          status = "approved";
        }
        const sanatizedData = {
          creatorId: user._id,
          creatorName: `${user.firstName} ${user.lastName}`,
          orderName: data.name,
          notes: data.notes,
          status: status,
          labels: data.labels,
          qty: data.qty,
        };
        const createdOrder = await dbContext.Order.create(sanatizedData);
        if (needsApproval.length > 0) {
          // TODO UNCOMMENT TO SEND EMAILS OUT
          await emailService.leadApprovalEmail(createdOrder);
        }
        emailService.successFullOrderSubmission(createdOrder);
        return createdOrder;
      }
    } catch (error) {
      emailService.unSuccessFullOrderSubmission(data, token);
      logger.error(error);
      return error;
    }
  }

  async updateLabel(token, orderId, data, labelId) {
    try {
      const user = await this.checkIfUserExists(token);
      const order = await dbContext.Order.findById(orderId);
      if (user._id == order.creatorId) {
        return Promise.resolve(401);
      } else {
        const label = order.labels.filter((l) => l._id == labelId);
        let objectWithQty = data.find((obj) => "qty" in obj);
        let qty;
        if (objectWithQty.qty != label[0].qty) {
          qty = objectWithQty.qty;
        } else {
          qty = label.qty;
        }
        const newArr = [];
        for (let i = 0; i < data.length - 1; i++) {
          const firstObj = data[i];
          const originalData = label[0].textToPut[i];
          let newObj = {};
          newObj["name"] = originalData.name;
          newObj["text"] = firstObj[originalData.name];
          newArr.push(newObj);
        }
        const filter = { _id: orderId, "labels._id": labelId };
        const update = {
          $set: { "labels.$.textToPut": newArr, "labels.$.qty": qty },
        };
        const options = { returnOriginal: false };
        const updatedLabel = await dbContext.Order.findOneAndUpdate(
          filter,
          update,
          options
        );
        const lab = await dbContext.Label.findById(label[0].labelId);
        if (lab.isBulkLabel == false) {
          await dbContext.Order.findOneAndUpdate(filter, {
            status: "waiting for approval",
          });
          // TODO UNCOMMENT TO SEND EMAIL OUT TO LEAD ABOUT UPDATED LABEL
          await emailService.leadApprovalEmail(updatedLabel);
        }
        return updatedLabel;
      }
    } catch (error) {
      logger.error(error);
      return error;
    }
  }

  async getUserOrder(token) {
    try {
      const user = await this.checkIfUserExists(token);
      if (user == 400) {
        return Promise.resolve(400);
      } else {
        const orders = await dbContext.Order.find({ creatorId: user._id });
        let arr = [];
        for (let i = 0; i < orders.length; i++) {
          const order = orders[i];
          const labelIds = order.labels.map((l) => l.labelId);
          const labels = [];
          for (let s = 0; s < labelIds.length; s++) {
            const id = labelIds[s];
            const label = await dbContext.Label.findById(id);
            labels.push(label);
          }
          // const labels = await dbContext.Label.find({ _id: { $in: [...labelIds, ...labelIds] } })

          let doubleArr = [];
          for (let r = 0; r < order.labels.length; r++) {
            const lbl = order.labels[r];
            let obj = {
              maxOrderQty: labels[r].maxOrderQty,
              pdf: labels[r].pdfPath,
              docNum: labels[r].docNum,
              unitPack: labels[r].unitPack,
              name: labels[r].name,
              categoryName: labels[r].categoryName,
              subCategoryName: labels[r].subCategoryName,
              fileName: labels[r].fileName,
              labelId: labels[r]._id,
              orderId: order._id,
              _id: lbl._id,
            };
            doubleArr.push(obj);
          }
          arr.push(doubleArr);
        }
        return { orders, arr };
      }
    } catch (error) {
      logger.error(error);
      return error;
    }
  }

  async getAllOrders(token) {
    try {
      const user = await this.checkIfUserExists(token);
      if (user == 400) {
        return Promise.resolve(400);
      } else {
        if (user.privileges != "admin" && user.privileges != "printshop") {
          return Promise.resolve(403);
        } else {
          const orders = await dbContext.Order.find();
          return orders;
        }
      }
    } catch (error) {
      logger.error(error);
      return error;
    }
  }

  async getAllApprovedOrders(token) {
    try {
      const user = await this.checkIfUserExists(token);
      if (user == 400) {
        return Promise.resolve(400);
      } else {
        if (user.privileges != "printshop") {
          return Promise.resolve(403);
        } else {
          let orders = await dbContext.Order.find({ status: "approved" });
          let arr = [];
          for (let i = 0; i < orders.length; i++) {
            const order = orders[i];
            const labelIds = order.labels.map((l) => l.labelId);
            const labels = [];
            for (let s = 0; s < labelIds.length; s++) {
              const id = labelIds[s];
              const label = await dbContext.Label.findById(id);
              labels.push(label);
            }
            // const labels = await dbContext.Label.find({ _id: { $in: [...labelIds, ...labelIds] } })

            let doubleArr = [];
            for (let r = 0; r < order.labels.length; r++) {
              const material = await dbContext.Material.findById(
                labels[r].materialTypeId
              );
              let obj = {
                pdf: labels[r].pdfPath,
                docNum: labels[r].docNum,
                unitPack: labels[r].unitPack,
                name: labels[r].name,
                categoryName: labels[r].categoryName,
                subCategoryName: labels[r].subCategoryName,
                fileName: labels[r].fileName,
                material: material.name,
              };
              doubleArr.push(obj);
            }
            arr.push(doubleArr);
          }

          return { orders, arr };
        }
      }
    } catch (error) {
      logger.error(error);
      return error;
    }
  }

  async getAllProcessingOrders(token) {
    try {
      const user = await this.checkIfUserExists(token);
      if (user == 400) {
        return Promise.resolve(400);
      } else {
        if (user.privileges != "printshop") {
          return Promise.resolve(403);
        } else {
          const orders = await dbContext.Order.find({ status: "processing" });
          let arr = [];
          for (let i = 0; i < orders.length; i++) {
            const order = orders[i];
            const labelIds = order.labels.map((l) => l.labelId);
            // const labels = await dbContext.Label.find({ _id: { $in: labelIds } })
            const labels = [];
            for (let s = 0; s < labelIds.length; s++) {
              const id = labelIds[s];
              const label = await dbContext.Label.findById(id);
              labels.push(label);
            }

            let doubleArr = [];
            for (let r = 0; r < order.labels.length; r++) {
              const material = await dbContext.Material.findById(
                labels[r].materialTypeId
              );
              let obj = {
                pdf: labels[r].pdfPath,
                docNum: labels[r].docNum,
                unitPack: labels[r].unitPack,
                name: labels[r].name,
                categoryName: labels[r].categoryName,
                subCategoryName: labels[r].subCategoryName,
                fileName: labels[r].fileName,
                material: material.name,
              };
              doubleArr.push(obj);
            }
            arr.push(doubleArr);
          }

          return { orders, arr };
        }
      }
    } catch (error) {
      logger.error(error);
      return error;
    }
  }

  async getAllDeliveredOrders(token) {
    try {
      const user = await this.checkIfUserExists(token);
      if (user == 400) {
        return Promise.resolve(400);
      } else {
        if (user.privileges != "printshop") {
          return Promise.resolve(403);
        } else {
          const orders = await dbContext.Order.find({ status: "delivered" });
          let arr = [];
          for (let i = 0; i < orders.length; i++) {
            const order = orders[i];
            const labelIds = order.labels.map((l) => l.labelId);
            // const labels = await dbContext.Label.find({ _id: { $in: labelIds } })
            const labels = [];
            for (let s = 0; s < labelIds.length; s++) {
              const id = labelIds[s];
              const label = await dbContext.Label.findById(id);
              labels.push(label);
            }

            let doubleArr = [];
            for (let r = 0; r < order.labels.length; r++) {
              const material = await dbContext.Material.findById(
                labels[r].materialTypeId
              );
              let obj = {
                pdf: labels[r].pdfPath,
                docNum: labels[r].docNum,
                unitPack: labels[r].unitPack,
                name: labels[r].name,
                categoryName: labels[r].categoryName,
                subCategoryName: labels[r].subCategoryName,
                fileName: labels[r].fileName,
                material: material.name,
              };
              doubleArr.push(obj);
            }
            arr.push(doubleArr);
          }

          return { orders, arr };
        }
      }
    } catch (error) {
      logger.error(error);
      return error;
    }
  }

  async deleteOrder(token, id) {
    try {
      const user = await this.checkIfUserExists(token);
      if (user == 400) {
        return Promise.resolve(400);
      } else {
        const order = await dbContext.Order.findById(id);
        if (!order) {
          return Promise.resolve(400);
        } else {
          if (
            !order.creatorId.equals(user._id) &&
            user.privileges != "printshop"
          ) {
            return Promise.resolve(403);
          } else {
            if (order.status == "processing") {
              return Promise.resolve(403);
            } else {
              await dbContext.Order.findByIdAndDelete(id);
              return order;
            }
          }
        }
      }
    } catch (error) {
      logger.error(error);
      return error;
    }
  }

  async deleteOldOrders() {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const today = new Date();

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    };

    const formattedToday = formatDate(today)
    const formattedTwoWeeksAgo = formatDate(twoWeeksAgo)

    try {
      const ordersBeforeDeletion = await dbContext.Order.find({
        status: "delivered",
      });
      const deletedOrders = await dbContext.Order.deleteMany({
        status: "delivered",
        updatedOn: { $lt: twoWeeksAgo },
      });
      const ordersAfterDeletion = await dbContext.Order.find({
        status: "delivered",
      });
      const deletedOrdersArray = ordersBeforeDeletion.filter(
        (orderBefore) => !ordersAfterDeletion.some((orderAfter) => orderBefore.id === orderAfter.id)
      );

      // If there are deleted orders then delete the directories
      if (deletedOrders.deletedCount > 0) {
        const directoriesToDeleteProps = deletedOrdersArray.map(
          async (order) => {
            const deletedOrderOwner = await dbContext.Account.findById(
              order.creatorId
            );
            const { department, firstName, lastName } = deletedOrderOwner;

            return {
              department: department,
              firstName: firstName,
              lastName: lastName,
              orderId: order._id,
            };
          }
        );

        const directoriesToDelete = await Promise.all(directoriesToDeleteProps);

        directoriesToDelete.forEach(async (directory, index) => {
          const { department, firstName, lastName, orderId } = directory;
          const pathToDirectory = filePath.join(
            __dirname,
            "..",
            "..",
            "..",
            "gena_2",
            "server",
            "images",
            "prints",
            `${department}-${firstName}-${lastName}-${orderId}`
          );

          try {
            await fs.rm(pathToDirectory, { recursive: true, force: true }, () => {
              console.log(`%cSuccessfully removed directory: ${pathToDirectory}`, "color:#edc81d");
              if(index == directoriesToDelete.length - 1) {
                logger.log("_".repeat(100));
              }
            });
          } catch (error) {
            logger.error(`Error removing directory ${pathToDirectory}: ${error.message}`);
          }
        });
        
        logger.log('_'.repeat(100));
        logger.log(`DAILY MAINTENANCE ${formattedToday}: ${deletedOrders.deletedCount} Old Order${deletedOrders.deletedCount == 1 ? "" : "s"} Deleted. 💀`);
        logger.log(`DELETED ORDERS FROM ${formattedTwoWeeksAgo}:`);
        logger.log(directoriesToDelete);
        
        return;
      }

      logger.log(`DAILY MAINTENANCE ${formattedToday}: No Old Orders To Delete. 🤗`);

    } catch (error) {
      logger.error(error)
    }
  }

  async deleteLabelFromOrder(token, orderId, labelId) {
    try {
      const user = await this.checkIfUserExists(token);
      if (user == 400) {
        return Promise.resolve(400);
      } else {
        const order = await dbContext.Order.findById(orderId);
        if (!order) {
          return Promise.resolve(400);
        } else {
          if (!order.creatorId.equals(user._id)) {
            return Promise.resolve(403);
          } else {
            if (order.status == "processing") {
              return Promise.resolve(403);
            } else {
              // finds the index of the label that has the same id and the one sent
              const labelIndex = order.labels.findIndex(
                (label) => label._id.toString() === labelId.toString()
              );
              // if no index is found it will bring back a -1
              if (labelIndex === -1) {
                return Promise.resolve(400);
              } else {
                order.labels.splice(labelIndex, 1);
                await dbContext.Order.updateOne(
                  { _id: orderId },
                  { labels: order.labels }
                );
                const orderToSend = await dbContext.Order.findById(orderId);
                if (orderToSend.labels.length === 0) {
                  await dbContext.Order.findByIdAndDelete(orderId);
                  return Promise.resolve(200);
                } else {
                  return orderToSend;
                }
              }
            }
          }
        }
      }
    } catch (error) {
      logger.error(error);
      return error;
    }
  }

  async updatedOrder(token, data, orderId) {
    try {
      const needsApproval = [];
      let status;
      const user = await this.checkIfUserExists(token);
      if (user == 400) {
        return Promise.resolve(400);
      } else {
        const order = await dbContext.Order.findById(orderId);
        if (!order) {
          return Promise.resolve(400);
        } else if (order.status == "processing") {
          return Promise.resolve(405);
        } else if (!order.creatorId.equals(user._id)) {
          return Promise.resolve(403);
        } else {
          if (data.labels) {
            for (let i = 0; i < data.labels.length; i++) {
              const label = data.labels[i];
              const check = await dbContext.Label.findById(label.labelId);
              if (check.isBulkLabel != true) {
                needsApproval.push(label._id);
              }
            }
          }
          if (needsApproval.length > 0) {
            status = "waiting for approval";
          } else {
            status = order.status;
          }
          const notes = data.notes || order.notes;
          // if new labels are sent they will have to send old labels and and new ones
          const labels = data.labels || order.labels;
          const updated = new Date();
          await dbContext.Order.findOneAndUpdate(orderId, {
            notes: notes,
            labels: labels,
            status: status,
            updatedOn: updated,
          });
          const updatedOrder = await dbContext.Order.findById(orderId);
          return updatedOrder;
        }
      }
    } catch (error) {
      logger.error(error);
      return error;
    }
  }

  async checkIfUserExists(token) {
    const user = await dbContext.Account.findOne({ accessToken: token });
    if (!user) {
      return Promise.resolve(400);
    } else {
      return user;
    }
  }

  async getAllInCart(data) {
    const cart = await dbContext.Label.find({ _id: { $in: data.id } });
    return cart;
  }

  async getApprovalOrder(token) {
    try {
      const user = await this.checkIfUserExists(token);
      if (user == 400) {
        return user;
      } else if (
        user.privileges != "group-lead" &&
        user.privileges != "team-lead"
      ) {
        return Promise.resolve(401);
      } else {
        const data = await dbContext.Account.find({
          $or: [{ teamLeadId: user._id }, { groupLeadId: user._id }],
        });
        const ids = data.map((account) => account._id);
        const status = "waiting for approval";
        const orders = await dbContext.Order.find({
          creatorId: { $in: ids },
          status: { $eq: status },
        });

        return orders;
      }
    } catch (error) {
      logger.error(error);
      return error;
    }
  }

  async approveOrder(token, id) {
    try {
      const user = await this.checkIfUserExists(token);
      if (user == 400) {
        return user;
      } else if (
        user.privileges != "group-lead" &&
        user.privileges != "team-lead"
      ) {
        return 401;
      } else {
        const filter = { _id: id };
        const update = { $set: { status: "approved" } };
        const options = { returnOriginal: false };
        const order = await dbContext.Order.findOneAndUpdate(
          filter,
          update,
          options
        );
        return order;
      }
    } catch (error) {
      logger.error(error);
      return error;
    }
  }
  async declineOrder(token, id) {
    try {
      const user = await this.checkIfUserExists(token);
      if (user == 400) {
        return user;
      } else if (
        user.privileges != "group-lead" &&
        user.privileges != "team-lead"
      ) {
        return 401;
      } else {
        const filter = { _id: id };
        const update = { $set: { status: "declined" } };
        const options = { returnOriginal: false };
        const order = await dbContext.Order.findOneAndUpdate(
          filter,
          update,
          options
        );
        return order;
      }
    } catch (error) {
      logger.error(error);
      return error;
    }
  }

  async printShopDeliverOrder(id, token) {
    try {
      const user = await dbContext.Account.findOne({ accessToken: token });
      if (user.privileges != "printshop") {
        return Promise.resolve(401);
      } else {
        const order = await dbContext.Order.findById(id);
        if (!order) {
          return Promise.resolve(400);
        } else {
          const filter = { _id: id };
          const update = { $set: { status: "delivered" } };
          const options = { returnOriginal: false };
          const updatedOrder = await dbContext.Order.findOneAndUpdate(
            filter,
            update,
            options
          );
          return updatedOrder;
        }
      }
    } catch (error) {
      logger.error(error);
      return error;
    }
  }

  async getGroupLeadOrderApproveLabels(arr) {
    try {
      const orderIds = arr.map((id) => mongoose.Types.ObjectId(id));
      const orders = await dbContext.Order.find({ _id: { $in: orderIds } });
      let mainArr = [];
      for (let i = 0; i < orders.length; i++) {
        let orderArr = [];
        const order = orders[i];
        for (let o = 0; o < order.labels.length; o++) {
          const label = order.labels[o];
          let id = label.labelId;
          const l = await dbContext.Label.findById(
            id,
            "categoryName subCategoryName fileName unitPack docNum"
          ).exec();
          orderArr.push(l);
        }
        mainArr.push(orderArr);
      }
      return mainArr;
    } catch (error) {
      logger.log(error);
      return error;
    }
  }

  ////////////// PICKUP ORDERS ///////////////////////

  async pickedUpBy(token, id, data) {
    try {
      const user = await dbContext.Account.findOne({ accessToken: token });
      if (user.privileges != "printshop") {
        return Promise.resolve(401);
      } else {
        const order = await dbContext.Order.findById(id);
        if (!order) {
          return Promise.resolve(400);
        } else {
          const filter = { _id: id };
          const update = { $set: { pickedUpBy: data.name } };
          const options = { returnOriginal: false };
          const updatedOrder = await dbContext.Order.findOneAndUpdate(
            filter,
            update,
            options
          );
          return updatedOrder;
        }
      }
    } catch (error) {}
  }

  async getAllReadyForPickup(token) {
    const user = await this.checkIfUserExists(token);
    if (user == 400) {
      return user;
    } else if (user.privileges != "printshop") {
      return Promise.resolve(400);
    } else {
      const orders = await dbContext.Order.find({ status: "ready for pickup" });
      let arr = [];
      for (let i = 0; i < orders.length; i++) {
        const order = orders[i];
        const labelIds = order.labels.map((l) => l.labelId);
        // const labels = await dbContext.Label.find({ _id: { $in: labelIds } })
        const labels = [];
        for (let s = 0; s < labelIds.length; s++) {
          const id = labelIds[s];
          const label = await dbContext.Label.findById(id);
          labels.push(label);
        }

        let doubleArr = [];
        for (let r = 0; r < order.labels.length; r++) {
          const material = await dbContext.Material.findById(
            labels[r].materialTypeId
          );
          let obj = {
            pdf: labels[r].pdfPath,
            docNum: labels[r].docNum,
            unitPack: labels[r].unitPack,
            name: labels[r].name,
            categoryName: labels[r].categoryName,
            subCategoryName: labels[r].subCategoryName,
            fileName: labels[r].fileName,
            material: material.name,
          };
          doubleArr.push(obj);
        }
        arr.push(doubleArr);
      }

      return { orders, arr };
    }
  }

  async updateToPickup(id, token) {
    try {
      const user = await dbContext.Account.findOne({ accessToken: token });
      if (user.privileges != "printshop") {
        return Promise.resolve(401);
      } else {
        const order = await dbContext.Order.findById(id);
        if (!order) {
          return Promise.resolve(400);
        } else {
          const filter = { _id: id };
          const update = { $set: { status: "ready for pickup" } };
          const options = { returnOriginal: false };
          const updatedOrder = await dbContext.Order.findOneAndUpdate(
            filter,
            update,
            options
          );
          await emailService.readyForPickupEmail(updatedOrder);
          return updatedOrder;
        }
      }
    } catch (error) {
      logger.log(error);
      return error;
    }
  }
}

export const orderService = new OrderService();
