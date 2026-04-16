import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);

  createOrder(userId: number) {
    return this.http.post<{orderId: string; amount: number; currency: string; keyId: string}>(
      `${environment.apiUrl}/payments/create-order`,
      { userId }
    );
  }

  verifyPayment(paymentData: any) {
    return this.http.post(`${environment.apiUrl}/payments/verify`, paymentData);
  }

  loadRazorpayScript(): Promise<any> {
    return new Promise(resolve => {
      if ((window as any).Razorpay) {
        return resolve((window as any).Razorpay);
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve((window as any).Razorpay);
      document.body.appendChild(script);
    });
  }
}
