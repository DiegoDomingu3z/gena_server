import { dbContext } from "../db/DbContext"
import { logger } from "../utils/Logger"
import { PDFDocument } from 'pdf-lib'
const fs = require('fs');
const { readFile, writeFile } = require('fs/promises');

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
                // variables we will use later
                let pdfDoc;
                let path;
                // loop through all the labels in the order sent
                for (let i = 0; i < order.labels.length; i++) {
                    const label = order.labels[i];
                    // find the established label that the user ordered
                    const findOrder = await dbContext.Label.findById(label.labelId)
                    // check to see if that label is used to print in bulk
                    if (findOrder.isBulkLabel == true) {
                        if (!findOrder.pdfBulkPath) {
                            return Promise.resolve(400)
                        } else {
                            logger.log("NO BULK PDF PATH FOUND")
                            // find the path of the bulk path to print
                            // load the file
                            pdfDoc = await PDFDocument.load(`${findOrder.pdfBulkPath}/${findOrder.categoryName}/${findOrder.subCategoryName}/${findOrder.fileName}`)
                        }
                    } else {
                        // return error if no path was found to that file
                        if (!findOrder.pdfPath) {
                            logger.log('NO PDF PATH FOUND')
                            return Promise.resolve(400)
                        } else {
                            // find the path to the file
                            let pdfDocPath = `${findOrder.pdfPath}${findOrder.categoryName}/${findOrder.subCategoryName}/${findOrder.fileName}`
                            // load the file
                            pdfDoc = await PDFDocument.load(await readFile(pdfDocPath))
                        }
                    }
                    // read the pdf
                    const form = pdfDoc.getForm()
                    // if kanban (files you put text on do the loop)
                    if (findOrder.isKanban == true) {
                        for (let i = 0; i < findOrder.fields.length; i++) {
                            const field = findOrder.fields[i];
                            const inputName = field.name.toUpperCase()
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
                            path = `../../../repos/inventive/gena_2/src/prints/${findOrder.fileName}`
                        } else {
                            let newName = findOrder.fileName.slice(0, -4);
                            path = `../../../repos/inventive/gena_2/src/prints/${newName}(${i}).pdf`
                        }
                        await fs.promises.writeFile(path, pdfBytes)
                    }
                }
            }
        } catch (error) {
            logger.error(error)
            return error
        }
    }





}


export const printShopService = new PrintShopService()