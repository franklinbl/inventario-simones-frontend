import { Routes } from '@angular/router';
import { RentalsComponent } from './rentals.component';
import { AddUpdateRentalComponent } from './components/add-update-rental/add-update-rental.component';

export const RENTALS_ROUTES: Routes = [
  { path: '', component: RentalsComponent },
  { path: 'new', component: AddUpdateRentalComponent },
  { path: ':rentalId', component: AddUpdateRentalComponent },
];