import mongoose from 'mongoose'
import { AccountSchema } from '../models/Accounts'
import { CategorySchema } from '../models/Category'
import { SubCategorySchema } from '../models/SubCategory'
class DbContext {

    Account = mongoose.model('Account', AccountSchema)

    Category = mongoose.model('Category', CategorySchema)

    SubCategory = mongoose.model('SubCategory', SubCategorySchema)

}


export const dbContext = new DbContext()