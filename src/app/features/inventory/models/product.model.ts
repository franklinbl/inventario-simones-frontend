export interface ProductAttributes {
  id: number;
  code: string;
  name: string;
  description: string;
  total_quantity: number;
  available_quantity: number;
  price: number;
  rental_product? : {
    quantity_rented: number;
    quantity_returned: number;
  }
}