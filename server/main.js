import express from 'express'
import { socketProvider } from './SocketProvider'
import { Startup } from './Startup'
import { DbConnection } from './db/DbConfig'
import { logger } from './utils/Logger'
import { createServer } from 'http'


const app = express()
const port = process.env.PORT || 3000

const httpServer = createServer(app)
Startup.ConfigureGlobalMiddleware(app)
Startup.ConfigureRoutes(app)


process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;


socketProvider.initialize(httpServer)


DbConnection.connect()



// Start Server
httpServer.listen(port, () => {
    logger.log(`[SERVING ON PORT: ${port}]`)
})
