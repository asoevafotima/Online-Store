import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { ordersApi } from '../../api/orders';
import { formatDateTime, formatPrice } from '../../lib/utils';
import { Button } from '../components/ui/button';
import { Order } from '../../lib/types';

const OrdersPage: React.FC = () => {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: ordersApi.getMyOrders,
  });

  const getStatusIcon = (status: string) => {
    switch(status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'cancelled':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
    }
  };

  return (
    <div className="page-container py-12 max-w-5xl">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Order History</h1>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card p-6 h-32 skeleton rounded-2xl"></div>
          ))}
        </div>
      ) : !orders || orders.length === 0 ? (
        <div className="glass-card py-20 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
            <Package className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold mb-4">No orders yet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">When you place an order, it will appear here.</p>
          <Link to="/products">
            <Button>Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order: Order) => (
            <div key={order.id} className="glass-card overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-200 dark:border-gray-800 gap-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 w-full">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Order Placed</p>
                    <p className="font-medium">{formatDateTime(order.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total</p>
                    <p className="font-medium">{formatPrice(order.total_amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Order #</p>
                    <p className="font-medium">{order.id}</p>
                  </div>
                  <div className="flex items-center justify-end">
                    <Link to={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm" className="hidden sm:flex">
                        View Details <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex -space-x-4">
                    {/* Placeholder for order items images */}
                    {[1, 2, 3].slice(0, 3).map((_, i) => (
                      <div key={i} className="w-16 h-16 rounded-full border-2 border-white dark:border-gray-900 bg-gray-100 overflow-hidden">
                        <img src={`https://ui-avatars.com/api/?name=Item&background=random&size=100`} alt="Item" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-2">{order.status}</span>
                    </span>
                    <p className="text-sm text-gray-500 mt-2">
                      {order.status === 'Pending' ? 'Preparing for shipment' : `Updated on ${formatDateTime(order.updated_at)}`}
                    </p>
                  </div>
                </div>

                <Link to={`/orders/${order.id}`} className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:hidden">
                    View Details
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
