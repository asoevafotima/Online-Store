import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Check, CreditCard, MapPin, PackageCheck, Loader2 } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { ordersApi } from '../../api/orders';
import { formatPrice } from '../../lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToast } from '../../hooks/use-toast';
import { PAYMENT_METHODS } from '../../lib/constants';

const checkoutSchema = z.object({
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City is required'),
  payment_method: z.string().min(1, 'Please select a payment method'),
  discount_code: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

const CheckoutPage: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  
  const { cart, clearCart } = useCartStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const cartTotal = cart?.items.reduce((total, item) => total + (item.subtotal || 0), 0) || 0;
  const shipping = cartTotal > 100 ? 0 : 10;
  const tax = cartTotal * 0.08;
  const finalTotal = cartTotal + shipping + tax;

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      payment_method: 'card',
    },
  });

  const paymentMethod = watch('payment_method');

  const onNextStep = async (currentStep: number) => {
    if (currentStep === 1) {
      const isStepValid = await trigger(['address', 'city']);
      if (isStepValid) setStep(2);
    } else if (currentStep === 2) {
      const isStepValid = await trigger(['payment_method']);
      if (isStepValid) setStep(3);
    }
  };

  const onSubmit = async (data: CheckoutFormValues) => {
    try {
      setIsSubmitting(true);
      const order = await ordersApi.create(data);
      setOrderId(order.id);
      await clearCart();
      toast({
        title: 'Order placed successfully!',
        description: `Your order #${order.id} has been confirmed.`,
      });
      // Move to success screen (still step 3 visually but completed state)
    } catch (error: any) {
      toast({
        title: 'Checkout failed',
        description: error.response?.data?.detail || 'An error occurred during checkout',
        variant: 'destructive',
      });
      setStep(2); // Go back to payment step on failure
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!cart || cart.items.length === 0 && !orderId) {
    return (
      <div className="page-container py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <Button onClick={() => navigate('/products')}>Return to Shop</Button>
      </div>
    );
  }

  const steps = [
    { num: 1, title: 'Shipping', icon: MapPin },
    { num: 2, title: 'Payment', icon: CreditCard },
    { num: 3, title: 'Confirm', icon: PackageCheck },
  ];

  return (
    <div className="page-container py-8 md:py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Main Content */}
        <div className="w-full lg:w-2/3">
          
          {/* Stepper */}
          <div className="flex items-center justify-between mb-10 relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-800 -z-10 -translate-y-1/2"></div>
            <div 
              className="absolute top-1/2 left-0 h-0.5 bg-brand-500 -z-10 -translate-y-1/2 transition-all duration-500"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            ></div>
            
            {steps.map((s) => {
              const Icon = s.icon;
              const isActive = step === s.num;
              const isCompleted = step > s.num || orderId;
              
              return (
                <div key={s.num} className="flex flex-col items-center bg-white dark:bg-surface-darker px-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-brand-500 text-white' 
                      : isActive 
                        ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 border-2 border-brand-500' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }`}>
                    {isCompleted ? <Check className="h-6 w-6" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`text-sm font-medium mt-2 ${isActive || isCompleted ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Forms */}
          {orderId ? (
            <div className="glass-card p-12 text-center animate-scale-in">
              <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
                <PackageCheck className="h-12 w-12" />
              </div>
              <h2 className="text-3xl font-bold mb-4">Thank You For Your Order!</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Your order #{orderId} has been successfully placed. We'll send you an email confirmation shortly.
              </p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={() => navigate('/products')}>Continue Shopping</Button>
                <Button onClick={() => navigate(`/orders/${orderId}`)}>Track Order</Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Step 1: Shipping */}
              {step === 1 && (
                <div className="glass-card p-8 animate-fade-in">
                  <h2 className="text-xl font-bold mb-6 flex items-center">
                    <MapPin className="mr-2 h-5 w-5 text-brand-500" /> Shipping Details
                  </h2>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">Street Address</Label>
                      <Input
                        id="address"
                        placeholder="123 Main St"
                        {...register('address')}
                        className={errors.address ? 'border-red-500' : ''}
                      />
                      {errors.address && <p className="text-sm text-red-500">{errors.address.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="New York"
                        {...register('city')}
                        className={errors.city ? 'border-red-500' : ''}
                      />
                      {errors.city && <p className="text-sm text-red-500">{errors.city.message}</p>}
                    </div>
                  </div>
                  <div className="mt-8 flex justify-end">
                    <Button type="button" onClick={() => onNextStep(1)}>Continue to Payment</Button>
                  </div>
                </div>
              )}

              {/* Step 2: Payment */}
              {step === 2 && (
                <div className="glass-card p-8 animate-fade-in">
                  <h2 className="text-xl font-bold mb-6 flex items-center">
                    <CreditCard className="mr-2 h-5 w-5 text-brand-500" /> Payment Method
                  </h2>
                  <div className="space-y-4">
                    {PAYMENT_METHODS.map((method) => (
                      <div 
                        key={method.value}
                        className={`border rounded-xl p-4 cursor-pointer transition-all ${paymentMethod === method.value ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/10' : 'border-gray-200 dark:border-gray-800 hover:border-brand-300'}`}
                        onClick={() => setValue('payment_method', method.value)}
                      >
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${paymentMethod === method.value ? 'border-brand-500' : 'border-gray-300'}`}>
                            {paymentMethod === method.value && <div className="w-3 h-3 rounded-full bg-brand-500"></div>}
                          </div>
                          <span className="font-medium">{method.label}</span>
                        </div>
                      </div>
                    ))}
                    {errors.payment_method && <p className="text-sm text-red-500">{errors.payment_method.message}</p>}
                  </div>
                  <div className="mt-8 flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
                    <Button type="button" onClick={() => onNextStep(2)}>Review Order</Button>
                  </div>
                </div>
              )}

              {/* Step 3: Confirm */}
              {step === 3 && (
                <div className="glass-card p-8 animate-fade-in">
                  <h2 className="text-xl font-bold mb-6 flex items-center">
                    <Check className="mr-2 h-5 w-5 text-brand-500" /> Review Your Order
                  </h2>
                  
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 mb-6">
                    <h3 className="font-semibold mb-2 text-sm uppercase tracking-wider text-gray-500">Shipping To</h3>
                    <p>{watch('address')}</p>
                    <p>{watch('city')}</p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 mb-6">
                    <h3 className="font-semibold mb-2 text-sm uppercase tracking-wider text-gray-500">Payment Method</h3>
                    <p>{PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label}</p>
                  </div>

                  <div className="mt-8 flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setStep(2)}>Back</Button>
                    <Button type="submit" className="shadow-glow" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                      ) : (
                        'Place Order'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          )}

        </div>

        {/* Order Summary Sidebar */}
        {!orderId && (
          <div className="w-full lg:w-1/3">
            <div className="glass-card p-6 sticky top-24">
              <h3 className="text-lg font-bold mb-4 border-b border-gray-200 dark:border-gray-800 pb-4">Order Summary</h3>
              
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 mb-6">
                {cart?.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div className="flex gap-3">
                      <span className="font-medium">{item.quantity}x</span>
                      <span className="text-gray-600 dark:text-gray-300 truncate max-w-[150px]">Product #{item.product_id}</span>
                    </div>
                    <span className="font-medium">{formatPrice(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                  <span>Subtotal</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                  <span>Tax</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-4 border-t border-gray-200 dark:border-gray-800">
                  <span>Total</span>
                  <span className="gradient-text">{formatPrice(finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CheckoutPage;
