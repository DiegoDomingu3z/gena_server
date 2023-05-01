import { dbContext } from "../db/DbContext"

class MaterialService {

    async createMaterial(data, userId) {
        const sanatizedData = {
            creatorId: userId,
            name: data.name
        }

        const newMaterial = await dbContext.Material.create(sanatizedData)
        return newMaterial
    }

}


export const materialService = new MaterialService()