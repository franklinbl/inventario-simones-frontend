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
  return_notes: string;
  start_date: Date;
  end_date: Date;
  date_returned: Date;
  status: StatusOptionRental;
  is_delivery_by_us: boolean;
  delivery_price: number;
  discount: number;
  created_by: number;
  creator?: CreatorAttributes;
  products: ProductAttributes[]
}

export enum StatusOptionRental {
  completed = 'completed',
  with_issues = 'with_issues',
  pending_return = 'pending_return'
}
