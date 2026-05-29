import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Package, Truck, CheckCircle2, ArrowLeft } from 'lucide-react';
import { ordersApi } from '../../api/orders';
import { formatPrice, formatDateTime } from '../../lib/utils';

const OrderTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getById(orderId),
    enabled: !!orderId,
  });

  if (isLoading) {
    return <div className="page-container py-20 text-center">Loading order details...</div>;
  }

  if (!order) {
    return <div className="page-container py-20 text-center font-bold text-xl">Order not found</div>;
  }

  const steps = [
    { title: 'Order Placed', icon: Package, date: order.created_at, completed: true },
    { title: 'Processing', icon: Package, date: order.updated_at, completed: ['Processing', 'Shipped', 'Delivered'].includes(order.status) },
    { title: 'Shipped', icon: Truck, date: null, completed: ['Shipped', 'Delivered'].includes(order.status) },
    { title: 'Delivered', icon: CheckCircle2, date: null, completed: order.status === 'Delivered' },
  ];

  return (
    <div className="page-container py-12 max-w-4xl">
      <Link to="/orders" className="inline-flex items-center text-gray-500 hover:text-brand-500 mb-8 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Order #{order.id}</h1>
          <p className="text-gray-500">Placed on {formatDateTime(order.created_at)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 mb-1">Total Amount</p>
          <p className="text-2xl font-bold gradient-text">{formatPrice(order.total_amount)}</p>
        </div>
      </div>

      {/* Tracking Timeline */}
      <div className="glass-card p-8 mb-8 overflow-hidden">
        <h2 className="text-xl font-bold mb-8">Tracking Status</h2>
        
        <div className="relative">
          <div className="absolute top-6 left-0 w-full h-1 bg-gray-200 dark:bg-gray-800 -z-10"></div>
          
          {/* Progress bar fill */}
          <div 
            className="absolute top-6 left-0 h-1 bg-brand-500 -z-10 transition-all duration-1000"
            style={{ 
              width: order.status === 'Delivered' ? '100%' : 
                     order.status === 'Shipped' ? '66%' : 
                     order.status === 'Processing' ? '33%' : '0%' 
            }}
          ></div>

          <div className="flex justify-between">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="flex flex-col items-center w-1/4 relative">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 border-white dark:border-surface-darker mb-4 transition-colors duration-500 ${
                    step.completed ? 'bg-brand-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-400'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className={`font-semibold text-center text-sm sm:text-base ${step.completed ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                    {step.title}
                  </h3>
                  {step.date && (
                    <p className="text-xs text-gray-500 text-center mt-1 hidden sm:block">
                      {formatDateTime(step.date).split(' ')[0]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card p-8">
          <h2 className="text-xl font-bold mb-6 flex items-center">
            <MapPin className="mr-2 h-5 w-5 text-brand-500" /> Shipping Details
          </h2>
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
            <p className="font-semibold mb-1">{order.address}</p>
            <p className="text-gray-600 dark:text-gray-400">{order.city}</p>
            <p className="text-gray-600 dark:text-gray-400 mt-4 text-sm font-medium">Payment: {order.payment_method.toUpperCase()}</p>
          </div>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-xl font-bold mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">Order Summary</h2>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
              <span className="font-medium">{formatPrice(order.total_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Shipping</span>
              <span className="font-medium">Free</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Tax</span>
              <span className="font-medium">$0.00</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-4 border-t border-gray-200 dark:border-gray-800">
              <span>Total</span>
              <span className="gradient-text">{formatPrice(order.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage;
