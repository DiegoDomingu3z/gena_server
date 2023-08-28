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
                const userOrder = await dbContext.Account.findById(order.creatorId)
                // variables we will use later
                let pdfDoc;
                let path;
                let path2;
                let finalPaths = []
                const mainFolderPath = await this.createMainFolder(userOrder, order)
                const printShopFolderPath = await this.createPrintShopMainFolder(userOrder, order)
                // loop through all the labels in the order sent
                for (let i = 0; i < order.labels.length; i++) {
                    const label = order.labels[i];
                    // find the established label that the user ordered
                    const findOrder = await dbContext.Label.findById(label.labelId)
                    const materialType = await this.createSubFolder(mainFolderPath, findOrder.materialTypeId)
                    await this.createPrintShopSubFolder(printShopFolderPath, findOrder.materialTypeId)
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
                            try {
                                const field = findOrder.fields[i];
                                const inputName = field.name
                                const fieldToFill = form.getTextField(inputName)
                                logger.log(label.textToPut[i].text)
                                fieldToFill.setText(label.textToPut[i].text)
                            } catch (error) {
                                const field = findOrder.fields[i];
                                const inputName = field.name
                                const checkbox = form.getCheckBox(inputName)
                                if (label.textToPut[i].text == 'true') {
                                    checkbox.check()
                                    logger.log(label.textToPut[i].text)
                                }
                            }

                        }
                    } else if (findOrder.isSerial) {
                        // do separate loop if serial number so it can save serialNum in database for each file iteration
                        for (let l = 0; l < label.qty; l++) {
                            const orderedLabel = await dbContext.Label.findById(label.labelId)
                            let serialCounter = orderedLabel.currentSerialNum
                            for (let i = 0; i < fieldNames.length; i++) {
                                const field = fieldNames[i];
                                const inputName = field
                                const fieldToFill = form.getTextField(inputName)
                                fieldToFill.setText(serialCounter.toString())
                                serialCounter++

                            }
                            let serialData = { currentSerialNum: serialCounter }
                            const filterId = { _id: label.labelId }
                            const reCurr = { returnOriginal: false }
                            const updatedLabel = await dbContext.Label.findByIdAndUpdate(filterId, serialData, reCurr)
                            let pdfBytes = await pdfDoc.save()
                            if (l == 0) {
                                path = `${mainFolderPath}/${materialType}/${findOrder.fileName}`
                                path2 = `${printShopFolderPath}/${materialType}/${findOrder.fileName}`
                            } else {
                                let newName = findOrder.fileName.slice(0, -4);
                                path = `${mainFolderPath}/${materialType}/${newName}(${l}).pdf`
                                path2 = `${printShopFolderPath}/${materialType}/${newName}(${l})`
                            }
                            if (fs.existsSync(path)) {
                                let newName = findOrder.fileName.slice(0, -4);
                                path = `${mainFolderPath}/${materialType}/${newName}(${l}).pdf`
                                path2 = `${mainFolderPath}/${materialType}/${newName}(${l}).pdf`
                                await fs.promises.writeFile(path, pdfBytes)
                                await fs.promises.writeFile(path2, pdfBytes)
                            } else {
                                await fs.promises.writeFile(path, pdfBytes)
                                await fs.promises.writeFile(path2, pdfBytes)
                            }
                            finalPaths.push(path)
                        }
                    }
                    if (findOrder.isSerial != true) {
                        // loop to print quantity the user requests
                        for (let i = 0; i < label.qty; i++) {
                            const pdfBytes = await pdfDoc.save()
                            // NOW CREATE FILE PATH TO WHERE TO SAVE THE PDF DOC
                            if (i == 0) {
                                path = `${mainFolderPath}/${materialType}/${findOrder.fileName}`
                                path2 = `${printShopFolderPath}/${materialType}/${findOrder.fileName}`
                            } else {
                                let newName = findOrder.fileName.slice(0, -4);
                                path = `${mainFolderPath}/${materialType}/${newName}(${i}).pdf`
                                path2 = `${printShopFolderPath}/${materialType}/${newName}(${i}).pdf`
                            }
                            if (fs.existsSync(path)) {
                                let newName = findOrder.fileName.slice(0, -4);
                                path = `${mainFolderPath}/${materialType}/${newName}(${i}).pdf`
                                path2 = `${printShopFolderPath}/${materialType}/${newName}(${i}).pdf`
                                await fs.promises.writeFile(path, pdfBytes)
                                await fs.promises.writeFile(path2, pdfBytes)
                            } else {
                                await fs.promises.writeFile(path, pdfBytes)
                                await fs.promises.writeFile(path2, pdfBytes)
                            }
                            finalPaths.push(path)
                        }
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

    async sleepFileCreation(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
        const mainFolderPath = filePath.join(__dirname, '..', '..', '..', 'gena_2', 'server', 'images', 'prints', `${user.department}-${user.firstName}-${user.lastName}-${order._id}`)
        // const mainFolderPath = `../../../repos/inventive/gena_2/public/images/prints/${user.department}-${user.firstName}-${user.lastName}-${order._id}`
        await mkdir(mainFolderPath, { recursive: true });
        return Promise.resolve(mainFolderPath)
    }

    async createPrintShopMainFolder(user, order){
        const printShopPath = filePath.join(__dirname, '..', '..', '..', '..', '..', 'data', 'marketing', 'label-orders', `${user.department}-${user.firstName}-${user.lastName}-${order._id}`)
        await mkdir (printShopPath, {recursive: true})
        return Promise.resolve(printShopPath)
    }


    async createSubFolder(mainFolderPath, materialId) {
        const material = await dbContext.Material.findById(materialId)
        const subFolderPath = material.name
        const newPath = `${mainFolderPath}/${subFolderPath}`
        mkdir(newPath, { recursive: true });
        return subFolderPath
    }

    async createPrintShopSubFolder(printShopPath, materialId){
        const material = await dbContext.Material.findById(materialId)
        const subFolderPath = material.name
        const newPath = `${printShopPath}/${subFolderPath}`
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
            let newString = substring.slice(46)
            let finalStr = "\\\\web\\data\\marketing\\label-orders" + newString
            logger.log(finalStr)

            if (process.platform === 'darwin') {
                // macOS
                command = `open "${finalStr}"`;
            } else if (process.platform === 'win32') {
                // Windows
                command = `start "" "${finalStr}"`;
            } else {
                // Linux or other systems
                command = `xdg-open "${finalStr}"`;
            }

            exec(command, (error) => {
                if (error) {
                    logger.error(`Failed to open folder in file manager: ${logger.message}`);
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