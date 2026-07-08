export interface IPaymentServices {
  createPayment: (...args: any[]) => Promise<any>;
  paymentSuccess: (...args: any[]) => Promise<any>;
  paymentCancel: (...args: any[]) => Promise<any>;
  getPaymentById: (...args: any[]) => Promise<any>;
  getMyPayments: (...args: any[]) => Promise<any>;
  getPaymentStats: (...args: any[]) => Promise<any>;
}
