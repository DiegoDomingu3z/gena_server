import { dbContext } from "../db/DbContext"
import { logger } from "../utils/Logger";

class OrderService {


    async createOrder(token, data) {
        try {
            const user = await this.checkIfUserExists(token)
            let needsApproval = []
            let status;
            if (user == 400) {
                return Promise.resolve(400)
            } else {
                for (let i = 0; i < data.labels.length; i++) {
                    const label = data.labels[i];
                    const check = await dbContext.Label.findById(label.labelId)
                    if (check.isBulkLabel != true) {
                        needsApproval.push(label._id)
                    }
                }
                logger.log(needsApproval.length)
                if (needsApproval.length > 0) {
                    status = 'waiting for approval'
                } else { status = 'approved' }
                const sanatizedData = {
                    creatorId: user._id,
                    creatorName: `${user.firstName} ${user.lastName}`,
                    notes: data.notes,
                    status: status,
                    labels: data.labels,
                    qty: data.qty
                }
                const createdOrder = await dbContext.Order.create(sanatizedData)
                return createdOrder
            }
        } catch (error) {
            logger.error(error)
            return error
        }

    }





    async getUserOrder(token) {
        try {
            const user = await this.checkIfUserExists(token)
            if (user == 400) {
                return Promise.resolve(400)
            } else {
                const orders = await dbContext.Order.find({ creatorId: user._id })
                return orders
            }
        } catch (error) {
            logger.error(error)
            return error
        }
    }

    async getAllOrders(token) {
        try {
            const user = await this.checkIfUserExists(token)
            if (user == 400) {
                return Promise.resolve(400)
            } else {
                if (user.privileges != 'admin' && user.privileges != 'printshop') {
                    return Promise.resolve(403)
                } else {
                    const orders = await dbContext.Order.find()
                    return orders
                }
            }
        } catch (error) {
            logger.error(error)
            return error
        }
    }


    async getAllApprovedOrders(token) {
        try {
            const user = await this.checkIfUserExists(token)
            if (user == 400) {
                return Promise.resolve(400)
            } else {
                if (user.privileges != 'printshop') {
                    return Promise.resolve(403)
                } else {
                    const orders = await dbContext.Order.find({ status: 'approved' })
                    return orders
                }
            }
        } catch (error) {
            logger.error(error)
            return error
        }
    }


    async getAllProcessingOrders(token) {
        try {
            const user = await this.checkIfUserExists(token)
            if (user == 400) {
                return Promise.resolve(400)
            } else {
                if (user.privileges != 'printshop') {
                    return Promise.resolve(403)
                } else {
                    const orders = await dbContext.Order.find({ status: 'processing' })
                    return orders
                }
            }
        } catch (error) {
            logger.error(error)
            return error
        }
    }

    async getAllDeliveredOrders(token) {
        try {
            const user = await this.checkIfUserExists(token)
            if (user == 400) {
                return Promise.resolve(400)
            } else {
                if (user.privileges != 'printshop') {
                    return Promise.resolve(403)
                } else {
                    const orders = await dbContext.Order.find({ status: 'delivered' })
                    return orders
                }
            }
        } catch (error) {
            logger.error(error)
            return error
        }
    }


    async deleteOrder(token, id) {
        try {
            const user = await this.checkIfUserExists(token)
            if (user == 400) {
                return Promise.resolve(400)
            } else {
                const order = await dbContext.Order.findById(id)
                if (!order) {
                    return Promise.resolve(400)
                } else {
                    if (!order.creatorId.equals(user._id)) {
                        return Promise.resolve(403)
                    } else {
                        if (order.status == 'processing') {
                            return Promise.resolve(403)
                        } else {
                            await dbContext.Order.findByIdAndDelete(id)
                            return order
                        }
                    }
                }

            }


        } catch (error) {
            logger.error(error)
            return error
        }
    }

    async deleteLabelFromOrder(token, orderId, labelId) {
        try {
            const user = await this.checkIfUserExists(token)
            if (user == 400) {
                return Promise.resolve(400)
            } else {
                const order = await dbContext.Order.findById(orderId)
                if (!order) {
                    return Promise.resolve(400)
                } else {
                    if (!order.creatorId.equals(user._id)) {
                        return Promise.resolve(403)
                    } else {
                        if (order.status == 'processing') {
                            return Promise.resolve(403)
                        } else {
                            // finds the index of the label that has the same id and the one sent
                            const labelIndex = order.labels.findIndex((label) => label._id.toString() === labelId.toString());
                            // if no index is found it will bring back a -1
                            if (labelIndex === -1) {
                                return Promise.resolve(400)
                            } else {
                                order.labels.splice(labelIndex, 1);
                                await dbContext.Order.updateOne({ _id: orderId }, { labels: order.labels });
                                const orderToSend = await dbContext.Order.findById(orderId)
                                if (orderToSend.labels.length === 0) {
                                    await dbContext.Order.findByIdAndDelete(orderId)
                                    logger.log("DELETE ORDER SINCE THERE ARE NO MORE LABELS IN THE ORDER")
                                    return Promise.resolve(200)
                                } else {
                                    return orderToSend
                                }
                            }

                        }

                    }
                }

            }
        } catch (error) {
            logger.error(error)
            return error
        }
    }



    async updatedOrder(token, data, orderId) {
        try {
            const needsApproval = []
            let status;
            const user = await this.checkIfUserExists(token)
            if (user == 400) {
                return Promise.resolve(400)
            } else {
                const order = await dbContext.Order.findById(orderId)
                if (!order) {
                    return Promise.resolve(400)
                } else if (order.status == 'processing') {
                    return Promise.resolve(405)
                } else if (!order.creatorId.equals(user._id)) {
                    return Promise.resolve(403)
                } else {
                    if (data.labels) {
                        for (let i = 0; i < data.labels.length; i++) {
                            const label = data.labels[i];
                            const check = await dbContext.Label.findById(label.labelId)
                            if (check.isBulkLabel == true) {
                                needsApproval.push(label._id)
                            }
                        }
                    }
                    if (needsApproval.length > 0) {
                        status = 'waiting for approval'
                        // EMAIL LEAD
                        logger.log("EMAIL FOR LEAD WOULD BE SENT")
                    } else {
                        status = order.status
                    }
                    const notes = data.notes || order.notes
                    // if new labels are sent they will have to send old labels and and new ones
                    const labels = data.labels || order.labels
                    const updated = new Date()
                    await dbContext.Order.findOneAndUpdate(orderId, {
                        notes: notes,
                        labels: labels,
                        status: status,
                        updatedOn: updated
                    })
                    const updatedOrder = await dbContext.Order.findById(orderId)
                    return updatedOrder
                }
            }
        } catch (error) {
            logger.error(error)
            return error
        }
    }






    async checkIfUserExists(token) {
        const user = await dbContext.Account.findOne({ accessToken: token })
        if (!user) {
            return Promise.resolve(400)
        } else {
            return user
        }
    }

    async getAllInCart(data) {
        const cart = await dbContext.Label.find({ _id: { $in: data.id } })
        return cart
    }

    async getApprovalOrder(token) {
        try {
            const user = await this.checkIfUserExists(token)
            if (user == 400) { return user }
            else if (user.privileges != "group-lead" && user.privileges != "team-lead") {
                return Promise.resolve(401)
            } else {
                const data = await dbContext.Account.find({ $or: [{ teamLeadId: user._id }, { groupLeadId: user._id }] })
                const ids = data.map(account => account._id);
                const status = 'waiting for approval'
                const orders = await dbContext.Order.find({ creatorId: { $in: ids }, status: { $eq: status } })
                return orders
            }
        } catch (error) {
            logger.error(error)
            return error
        }
    }

    async approveOrder(token, id) {
        try {
            const user = await this.checkIfUserExists(token)
            if (user == 400) { return user }
            else if (user.privileges != "group-lead"
                && user.privileges != "team-lead") { return 401 } else {
                const filter = { _id: id }
                const update = { $set: { status: 'approved' } }
                const options = { returnOriginal: false }
                const order = await dbContext.Order.findOneAndUpdate(filter, update, options)
                return order
            }
        } catch (error) {
            logger.error(error)
            return error
        }
    }
    async declineOrder(token, id) {
        try {
            const user = await this.checkIfUserExists(token)
            if (user == 400) { return user }
            else if (user.privileges != "group-lead"
                && user.privileges != "team-lead") { return 401 } else {
                const filter = { _id: id }
                const update = { $set: { status: 'declined' } }
                const options = { returnOriginal: false }
                const order = await dbContext.Order.findOneAndUpdate(filter, update, options)
                return order
            }
        } catch (error) {
            logger.error(error)
            return error
        }
    }

}





export const orderService = new OrderService()