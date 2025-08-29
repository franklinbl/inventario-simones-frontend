import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Alert {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alertSubject = new Subject<Alert>();
  alerts$ = this.alertSubject.asObservable();

  show(message: string, type: Alert['type'] = 'info', duration = 3000) {
    this.alertSubject.next({ message, type, duration });
  }

  success(message: string, duration = 3000) {
    this.show(message, 'success', duration);
  }

  error(message: string, duration = 3000) {
    this.show(message, 'error', duration);
  }

  info(message: string, duration = 3000) {
    this.show(message, 'info', duration);
  }

  warning(message: string, duration = 3000) {
    this.show(message, 'warning', duration);
  }
}
