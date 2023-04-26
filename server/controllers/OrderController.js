import { orderService } from "../services/OrderService";
import BaseController from "../utils/BaseController";
import { logger } from "../utils/Logger";
export class OrderController extends BaseController {
    constructor() {
        super('api/orders')
        this.router
            .post('/create', this.createOrder) //done
            // UPDATED CAN BE USED FOR REGULAR UPDATES, PRINTSHOP, TEAM LEADS/GROUP
            .put('/update/:id', this.updateOrder)
            .put('update/:orderId/label/:labelId', this.updateLabel)
            .delete('/delete/:id', this.deleteOrder) // done
            .delete('/delete/:orderId/label/:labelId', this.deleteLabel) // done
            .get('/my-orders', this.getUserOrders) //done
            .get('/all-orders', this.getAllOrders) //done
            .get('/print-shop/approved-by-lead', this.getApprovedOrders) //done
            .get('/print-shop/processing-orders', this.getProcessingOrders) // done
            .get('/delivered-orders', this.getDeliveredOrders) // done
    }



    async createOrder(req, res, next) {
        try {
            const token = req.header("Authorization")
            const data = req.body
            const newOrder = await orderService.createOrder(token, data)
            if (newOrder == 400) {
                res.status(400).send("FORBIDDEN")
            } else {
                res.status(200).send(newOrder)
            }
        } catch (error) {
            logger.error(error)
            next()
        }
    }


    async updateOrder(req, res, next) {
        try {
            const token = req.header("Authorization")
            const data = req.body
            // const OrderId
        } catch (error) {
            logger.error(error)
            next()
        }
    }

    async updateLabel(req, res, next) {
        try {
            const token = req.header("Authorization")
            const data = req.body
        } catch (error) {
            logger.error(error)
            next()
        }
    }


    async deleteOrder(req, res, next) {
        try {
            const token = req.header("Authorization")
            const orderId = req.params.id
            const deletedOrder = await orderService.deleteOrder(token, orderId)
            if (deletedOrder == 400) {
                res.status(400).send("USER NOT FOUND")
            } else if (deletedOrder == 403) {
                res.status(403).send("FORBIDDEN")
            } else {
                res.status(200).send("DELETED")
            }
        } catch (error) {
            logger.error(error)
            next()
        }
    }


    async deleteLabel(req, res, next) {
        try {
            const token = req.header("Authorization")
            const orderId = req.params.orderId
            const labelId = req.params.labelId
            const deletedLabel = orderService.deleteLabelFromOrder(token, orderId, labelId)
            if (deletedLabel == 400) {
                res.status(400).send("USER or Order or Label was not found in DB")
            } else if (deletedLabel == 403) {
                res.status(403).send("You do not have permission to do this action")
            } else {
                res.status(deletedLabel)
            }
        } catch (error) {
            logger.error(error)
            next()
        }
    }

    async getUserOrders(req, res, next) {
        try {
            const token = req.header("Authorization")
            const orders = await orderService.getUserOrder(token)
            if (orders == 400) {
                res.status(400).send("USER NOT FOUND")
            } else {
                res.status(200).send(orders)
            }
        } catch (error) {
            logger.error(error)
            next()
        }
    }

    async getAllOrders(req, res, next) {
        try {
            const token = req.header("Authorization")
            const orders = await orderService.getAllOrders(token)
            if (orders == 400) {
                res.status(400).send("FORBIDDEN")
            } else if (orders == 403) {
                res.status(403).send("YOU DON'T HAVE ACCESS TO VIEW ALL THE ORDERS")
            } else {
                res.status(200).send(orders)
            }
        } catch (error) {
            logger.error(error)
            next()
        }
    }

    async getApprovedOrders(req, res, next) {
        try {
            const token = req.header("Authorization")
            const orders = await orderService.getAllApprovedOrders(token)
            if (orders == 400) {
                res.status(400).send("FORBIDDEN")
            } else if (orders == 403) {
                res.status(403).send("YOU DON'T HAVE ACCESS TO VIEW ALL APPROVED ORDERS")
            } else {
                res.status(200).send(orders)
            }
        } catch (error) {
            logger.error(error)
            next()
        }
    }


    async getProcessingOrders(req, res, next) {
        try {
            const token = req.header("Authorization")
            const orders = await orderService.getAllProcessingOrders(token)
            if (orders == 400) {
                res.status(400).send("FORBIDDEN")
            } else if (orders == 403) {
                res.status(403).send("YOU DON'T HAVE ACCESS TO VIEW ALL APPROVED ORDERS")
            } else {
                res.status(200).send(orders)
            }
        } catch (error) {
            logger.error(error)
            next()
        }
    }

    async getDeliveredOrders(req, res, next) {
        try {
            const token = req.header("Authorization")
            const orders = await orderService.getAllDeliveredOrders(token)
            if (orders == 400) {
                res.status(400).send("FORBIDDEN")
            } else if (orders == 403) {
                res.status(403).send("YOU DON'T HAVE ACCESS TO VIEW ALL APPROVED ORDERS")
            } else {
                res.status(200).send(orders)
            }
        } catch (error) {
            logger.error(error)
            next()
        }
    }
}

