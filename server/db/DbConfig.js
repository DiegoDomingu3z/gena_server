import mongoose from 'mongoose'
import { logger } from '../utils/Logger'

mongoose.connection.on('error', err => {
    logger.error('[DATABASE ERROR]:', err)
})
mongoose.connection.on('connection', () => {
    logger.log('DbConnection Successful')
})

export class DbConnection {
    static async connect(connectionstring = process.env.CONNECTION_STRING || '') {
        const status = 0
        try {
            const status = await mongoose.connect(connectionstring)
            logger.log('[CONNECTION TO DB SUCCESSFUL]')
            return status
        } catch (e) {
            logger.error(
                '[MONGOOSE CONNECTION ERROR]:',
                'Invalid connection string'
            )
            return status
        }
    }
}


// USE THIS FOR MAIN DB INSTANCE

// export class DbConnection {
//     static async connect(connectionStrings = [process.env.CONNECTION_STRING || '', process.env.CONNECTION_STRING2 || '']) {
//         const statuses = [];
//         for (let i = 0; i < connectionStrings.length; i++) {
//             try {
//                 const connection = await mongoose.createConnection(connectionStrings[i]);
//                 logger.log(`[CONNECTION TO DB ${i + 1} SUCCESSFUL]`);
//                 statuses.push(0);
//             } catch (e) {
//                 logger.error(`[MONGOOSE CONNECTION ERROR ${i + 1}]: Invalid connection string`);
//                 statuses.push(1);
//             }
//         }
//         return statuses;
//     }
// }
