import { ProductAttributes } from "../../inventory/models/product.model";
import { ClientAttributes } from "../../clients/Models/client.model";

export interface CreatorAttributes {
  id: number;
  name: string;
  username: string;
}

export interface RentalAttributes {
  id: number;
  client: ClientAttributes;
  notes: string;
  start_date: Date;
  end_date: Date;
  status: string;
  is_delivery_by_us: boolean;
  delivery_price: number;
  discount: number;
  created_by: number;
  creator?: CreatorAttributes;
  products: ProductAttributes[]
}