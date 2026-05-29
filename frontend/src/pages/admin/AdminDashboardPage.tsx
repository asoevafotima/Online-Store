import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, Users, Package, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { productsApi } from '../../../api/products';
import { ordersApi } from '../../../api/orders';
import { usersApi } from '../../../api/users';
import { formatPrice } from '../../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

const AdminDashboardPage: React.FC = () => {
  const { data: products } = useQuery({ queryKey: ['admin-products'], queryFn: () => productsApi.getAll({}) });
  const { data: orders } = useQuery({ queryKey: ['admin-orders'], queryFn: ordersApi.getAll });
  const { data: users } = useQuery({ queryKey: ['admin-users'], queryFn: usersApi.getAll });

  const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
  const recentOrders = orders?.slice(0, 5) || [];

  const stats = [
    { title: 'Total Revenue', value: formatPrice(totalRevenue), icon: DollarSign, trend: '+12.5%', isPositive: true },
    { title: 'Total Orders', value: orders?.length || 0, icon: ShoppingBag, trend: '+5.2%', isPositive: true },
    { title: 'Total Products', value: products?.length || 0, icon: Package, trend: '-2.1%', isPositive: false },
    { title: 'Total Users', value: users?.length || 0, icon: Users, trend: '+18.2%', isPositive: true },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="glass border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${i === 0 ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : i === 1 ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : i === 2 ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs flex items-center mt-1 ${stat.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {stat.isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                {stat.trend} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <Card className="glass border-none shadow-sm">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">Order #{order.id}</span>
                    <span className="text-xs text-muted-foreground">{order.address}, {order.city}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-bold">{formatPrice(order.total_amount)}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'Delivered' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30'}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
              {recentOrders.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No recent orders</p>}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Placeholder */}
        <Card className="glass border-none shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <button className="flex flex-col items-center justify-center p-6 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/10 dark:hover:bg-brand-900/20 rounded-xl transition-colors border border-brand-100 dark:border-brand-900/30 text-brand-600 dark:text-brand-400">
              <Package className="h-8 w-8 mb-2" />
              <span className="font-medium">Add Product</span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/10 dark:hover:bg-blue-900/20 rounded-xl transition-colors border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400">
              <ShoppingBag className="h-8 w-8 mb-2" />
              <span className="font-medium">Manage Orders</span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/10 dark:hover:bg-purple-900/20 rounded-xl transition-colors border border-purple-100 dark:border-purple-900/30 text-purple-600 dark:text-purple-400">
              <Users className="h-8 w-8 mb-2" />
              <span className="font-medium">View Users</span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/10 dark:hover:bg-orange-900/20 rounded-xl transition-colors border border-orange-100 dark:border-orange-900/30 text-orange-600 dark:text-orange-400">
              <DollarSign className="h-8 w-8 mb-2" />
              <span className="font-medium">View Reports</span>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
