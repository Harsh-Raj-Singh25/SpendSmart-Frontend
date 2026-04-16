import { Component, OnInit } from '@angular/core';
import { PaymentService } from '../../core/services/payment.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-premium',
  standalone: false,
  templateUrl: './premium.html',
  styleUrls: ['./premium.scss']
})
export class PremiumComponent implements OnInit {
  isProcessing = false;

  constructor(
    private paymentService: PaymentService,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Pre-load Razorpay checkout script so it is ready when user clicks Upgrade
    this.paymentService.loadRazorpayScript().catch((err: any) => {
      console.error('Failed to load Razorpay checkout script:', err);
    });
  }

  upgrade() {
    // Get the currently logged-in user from auth state
    const user = this.authService.getCurrentUser();
    if (!user?.userId) {
      this.snackBar.open('Session expired. Please login again.', 'Close', { duration: 3000 });
      this.authService.logout();
      return;
    }

    this.isProcessing = true;

    // ── STEP 1: Create order on our server ──────────────────────────────────
    // The server creates a Razorpay Order and returns orderId + keyId + amount
    this.paymentService.createOrder(user.userId).subscribe({
      next: (res: any) => {

        // ── MOCK MODE (PAYMENT_MOCK_MODE=true in .env) ──────────────────────
        // Server returns keyId='mock_key_id' — skip Razorpay popup entirely
        // and call verify endpoint directly with synthetic payment data.
        if (res.keyId === 'mock_key_id') {
          this.verifyPayment(
            {
              razorpay_order_id:   res.orderId,
              razorpay_payment_id: `pay_mock_${Date.now()}`,
              razorpay_signature:  'mock_signature'
            },
            user.userId
          );
          // isProcessing will be reset inside verifyPayment()
          return;
        }

        // ── LIVE RAZORPAY CHECKOUT ──────────────────────────────────────────
        // Open the official Razorpay Checkout popup with the server order details
        const options: any = {
          key:         res.keyId,
          amount:      res.amount,        // in paise (10000 = ₹100)
          currency:    res.currency || 'INR',
          name:        'SpendSmart Premium',
          description: 'Unlimited transactions — ₹100/month',
          order_id:    res.orderId,
          // Called by Razorpay JS after the user successfully pays
          handler: (response: any) => {
            this.verifyPayment(response, user.userId);
          },
          prefill: {
            name:  user.fullName,
            email: user.email
          },
          theme: { color: '#4f46e5' },
          modal: {
            // Called when user closes the Razorpay popup without paying
            ondismiss: () => {
              this.isProcessing = false;
              this.snackBar.open('Payment cancelled. You can try again anytime.', 'Close', { duration: 3000 });
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        // isProcessing stays true until handler() or ondismiss() fires
      },

      error: (err: any) => {
        this.isProcessing = false;
        // Show the actual server-side error message when available
        const msg = err?.error?.message || 'Failed to initialize payment. Please try again.';
        this.snackBar.open(msg, 'Close', { duration: 5000 });
        console.error('Create order error:', err);
      }
    });
  }

  /**
   * STEP 3 — Verify payment with backend.
   *
   * Sends the Razorpay payment confirmation (or mock data) to our server.
   * The server verifies the HMAC signature and upgrades the user to PREMIUM.
   *
   * @param paymentResponse  Object from Razorpay handler or mock values
   * @param userId           ID of the logged-in user making the payment
   */
  verifyPayment(paymentResponse: any, userId: number): void {
    this.isProcessing = true;

    this.paymentService.verifyPayment({
      razorpayOrderId:   paymentResponse.razorpay_order_id,
      razorpayPaymentId: paymentResponse.razorpay_payment_id,
      razorpaySignature: paymentResponse.razorpay_signature,
      userId
    }).subscribe({
      next: (res: any) => {
        this.isProcessing = false;

        // Update local auth state so the navbar/dashboard reflects PREMIUM
        // immediately without requiring the user to log out and log back in
        const current = this.authService.getCurrentUser();
        if (current) {
          const updated = { ...current, subscriptionType: 'PREMIUM' as const };
          // Write back to localStorage so it persists on refresh
          localStorage.setItem('auth', JSON.stringify(updated));
          // Update both the BehaviorSubject and the Signal in AuthService
          this.authService['currentUserSubject']?.next(updated);
          this.authService['currentUser']?.set(updated);
        }

        const serverMsg = res?.message || 'Welcome to Premium! ₹100/month — unlimited transactions unlocked.';
        this.snackBar.open('🎉 ' + serverMsg, 'Close', { duration: 7000 });
      },

      error: (err: any) => {
        this.isProcessing = false;
        // Show the exact backend error (e.g., auth-service down, signature mismatch)
        const msg = err?.error?.message
          || 'Payment verification failed. If amount was deducted, please contact support.';
        this.snackBar.open(msg, 'Close', { duration: 7000 });
        console.error('Verify payment error:', err);
      }
    });
  }
}
