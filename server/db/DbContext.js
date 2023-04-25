import mongoose from 'mongoose'
import { AccountSchema } from '../models/Accounts'
import { CategorySchema } from '../models/Category'
import { SubCategorySchema } from '../models/SubCategory'
import { labelSchema } from '../models/label'
class DbContext {

    Account = mongoose.model('Account', AccountSchema)

    Category = mongoose.model('Category', CategorySchema)

    SubCategory = mongoose.model('SubCategory', SubCategorySchema)

    Label = mongoose.model('Label', labelSchema)
}


export const dbContext = new DbContext()