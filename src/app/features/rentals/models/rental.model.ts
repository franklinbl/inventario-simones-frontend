import { ProductAttributes } from "../../inventory/models/product.model";

export interface RentalAttributes {
  id: number;
  customer_name: string;
  start_date: Date;
  end_date: Date;
  status: string;
  products: ProductAttributes[]
}