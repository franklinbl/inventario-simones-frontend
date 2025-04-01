export interface ProductAttributes {
  id: number;
  name: string;
  description: string;
  total_quantity: number;
  available_quantity: number;
  RentalProduct? : {
    quantity: number
  }
}