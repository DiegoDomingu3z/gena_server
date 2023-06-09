import { dbContext } from "../db/DbContext"
import { logger } from "../utils/Logger"
import { PDFDocument } from 'pdf-lib'
const fs = require('fs');
const filePath = require('path');
const util = require('util');
const mkdir = util.promisify(fs.mkdir);
const { readFile, writeFile } = require('fs/promises');
const { exec } = require('child_process');
const path = require('path');
class PrintShopService {
    async createFilesToPrint(token, id) {
        try {
            // check to see if account exists and if its printshop making the request
            const user = await dbContext.Account.findOne({ accessToken: token })
            if (!user) {
                return Promise.resolve(400)
                // only printshop can call this api
            } else if (user.privileges != 'printshop') {
                return Promise.resolve(403)
            } else {
                // find the order by the id sent in
                const order = await dbContext.Order.findById(id)
                if (!order) {
                    return Promise.resolve(404)
                }
                const userOrder = dbContext.Account.findById(order.creatorId)
                // variables we will use later
                let pdfDoc;
                let path;
                let finalPaths = []
                const mainFolderPath = await this.createMainFolder(userOrder, order)
                // loop through all the labels in the order sent
                for (let i = 0; i < order.labels.length; i++) {
                    const label = order.labels[i];
                    // find the established label that the user ordered
                    const findOrder = await dbContext.Label.findById(label.labelId)
                    const materialType = await this.createSubFolder(mainFolderPath, findOrder.materialTypeId)
                    // check to see if that label is used to print in bulk
                    if (findOrder.isBulkLabel == true) {
                        if (!findOrder.pdfBulkPath) {
                            logger.log("NO BULK PDF PATH FOUND")
                            return Promise.resolve(400)
                        } else {
                            // find the path of the bulk path to print
                            // load the file
                            let pdfBulkPath = `${findOrder.pdfBulkPath}/${findOrder.categoryName}/${findOrder.subCategoryName}/${findOrder.bulkFileName}`
                            pdfDoc = await PDFDocument.load(await readFile(pdfBulkPath))
                        }
                    } else {
                        // return error if no path was found to that file
                        if (!findOrder.pdfPath) {
                            logger.log('NO PDF PATH FOUND')
                            return Promise.resolve(400)
                        } else {
                            // find the path to the file
                            let pdfDocPath = `${findOrder.pdfPath}/${findOrder.categoryName}/${findOrder.subCategoryName}/${findOrder.fileName}`
                            // load the file
                            pdfDoc = await PDFDocument.load(await readFile(pdfDocPath))
                        }
                    }
                    // read the pdf
                    const form = pdfDoc.getForm()
                    const fieldNames = form.getFields().map(field => field.getName());
                    logger.log(fieldNames);
                    // if kanban (files you put text on do the loop)
                    if (findOrder.isKanban == true) {
                        for (let i = 0; i < findOrder.fields.length; i++) {
                            const field = findOrder.fields[i];
                            const inputName = field.name
                            const fieldToFill = form.getTextField(inputName)
                            logger.log(label.textToPut[i].text)
                            fieldToFill.setText(label.textToPut[i].text)
                        }
                    }
                    // loop to print quantity the user requests
                    for (let i = 0; i < label.qty; i++) {
                        const pdfBytes = await pdfDoc.save()
                        // NOW CREATE FILE PATH TO WHERE TO SAVE THE PDF DOC
                        if (i == 0) {
                            path = `${mainFolderPath}/${materialType}/${findOrder.fileName}`
                        } else {
                            let newName = findOrder.fileName.slice(0, -4);
                            path = `${mainFolderPath}/${materialType}/${newName}(${i}).pdf`
                        }
                        if (fs.existsSync(path)) {
                            let newName = findOrder.fileName.slice(0, -4);
                            path = `${mainFolderPath}/${materialType}/${newName}(${i}).pdf`
                            await fs.promises.writeFile(path, pdfBytes)
                        } else {
                            await fs.promises.writeFile(path, pdfBytes)
                        }
                        finalPaths.push(path)
                    }
                }
                await this.addFinalPath(finalPaths, id)
            }
            await this.updateOrder(id)
            const finishedOrder = await dbContext.Order.findById(id)
            return Promise.resolve(finishedOrder)
        } catch (error) {
            logger.error(error)
            return error
        }
    }

    async addFinalPath(arr, id) {
        await dbContext.Order.findByIdAndUpdate(id, { finalOrderPaths: arr })
        return
    }

    async updateOrder(id) {
        const data = await dbContext.Order.findByIdAndUpdate(id, { status: 'processing', updatedOn: Date.now() })
        logger.log(data)
        return Promise.resolve(data)
    }


    async createMainFolder(user, order) {
        const mainFolderPath = filePath.join(__dirname, '..', '..', '..', 'gena_2', 'public', 'images', 'prints', `${user.department}-${user.firstName}-${user.lastName}-${order._id}`)
        // const mainFolderPath = `../../../repos/inventive/gena_2/public/images/prints/${user.department}-${user.firstName}-${user.lastName}-${order._id}`
        await mkdir(mainFolderPath, { recursive: true });
        return Promise.resolve(mainFolderPath)
    }


    async createSubFolder(mainFolderPath, materialId) {
        const material = await dbContext.Material.findById(materialId)
        const subFolderPath = material.name
        const newPath = `${mainFolderPath}/${subFolderPath}`
        mkdir(newPath, { recursive: true });
        return subFolderPath
    }


    async deliverOrder(id, token) {
        try {
            const user = await dbContext.Account.findOne({ accessToken: token })
            logger.log(user[0])
            if (!user) {
                return Promise.resolve(400)
            } else if (user.privileges != 'printshop') {
                return Promise.resolve(403)
            } else {
                const order = await dbContext.Order.findById(id)
                if (!order) {
                    return Promise.resolve(400)
                } else {
                    const updatedOrder = await dbContext.Order.findByIdAndUpdate(id, { status: 'delivered', updatedOn: Date.now() })
                    return Promise.resolve(200)
                }
            }
        } catch (error) {
            logger.error(error)
            return error
        }
    }

    async openFileManger(id) {
        try {
            const order = await dbContext.Order.findById(id)
            let command;
            let substring
            const orderId = id
            const filePath = order.finalOrderPaths[0]
            const index = filePath.indexOf(id);

            if (index !== -1) {
                substring = filePath.substring(0, index + orderId.length);
                console.log(substring);
            } else {
                logger.log('orderId not found in the string');
            }

            if (process.platform === 'darwin') {
                // macOS
                command = `open "${substring}"`;
            } else if (process.platform === 'win32') {
                // Windows
                command = `start "" "${substring}"`;
            } else {
                // Linux or other systems
                command = `xdg-open "${substring}"`;
            }

            exec(command, (error) => {
                if (error) {
                    console.error(`Failed to open folder in file manager: ${error.message}`);
                }
            });
            return
        } catch (error) {
            logger.error(error)
            return error
        }

    }




}


export const printShopService = new PrintShopService()