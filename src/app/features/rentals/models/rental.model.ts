import { ProductAttributes } from "../../inventory/models/product.model";

export interface RentalAttributes {
  id: number;
  client_name: string;
  client_phone: string;
  notes: string;
  start_date: Date;
  end_date: Date;
  status: string;
  products: ProductAttributes[]
}