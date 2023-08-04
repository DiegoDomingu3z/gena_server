import express from 'express'

export default class BaseController {
    constructor(mount) {
        if (typeof mount !== 'string') {
            throw new Error('Wrong Controller Bro')
        }
        if (mount[0] !== '/') {
            mount = '/' + mount
        }
        this.mount = mount
        this.router = express.Router({ mergeParams: true })
    }
}
