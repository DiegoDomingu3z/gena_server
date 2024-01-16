import mongoose from "mongoose";
import { AccountSchema } from "../models/Accounts";
import { CategorySchema } from "../models/Category";
import { SubCategorySchema } from "../models/SubCategory";
import { labelSchema } from "../models/label";
import { OrderSchema } from "../models/Order";
import { MaterialSchema } from "../models/Material";
import { DepartmentSchema } from "../models/Departments";
import { ArchivedOrderSchema } from "../models/ArchivedOrder";
import { snDefects } from "../models/snDefects";
import { TicketSchema } from "../models/Ticket";
class DbContext {
  Account = mongoose.model("Account", AccountSchema);

  Category = mongoose.model("Category", CategorySchema);

  SubCategory = mongoose.model("SubCategory", SubCategorySchema);

  Label = mongoose.model("Label", labelSchema);

  Order = mongoose.model("Order", OrderSchema);

  Material = mongoose.model("Material", MaterialSchema);

  Department = mongoose.model("Department", DepartmentSchema);

  ArchivedOrder = mongoose.model("ArchivedOrder", ArchivedOrderSchema);

  Defects = mongoose.model("snDefects", snDefects);

  Ticket = mongoose.model("Ticket", TicketSchema);
}

export const dbContext = new DbContext();
