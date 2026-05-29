import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, ShoppingCart, Users, Tags } from 'lucide-react';
import { cn } from '../../lib/utils';

const AdminSidebar: React.FC = () => {
  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { to: '/admin/products', icon: ShoppingBag, label: 'Products' },
    { to: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/categories', icon: Tags, label: 'Categories' },
  ];

  return (
    <aside className="w-64 glass border-r h-screen sticky top-0 hidden md:flex flex-col">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-bold gradient-text uppercase tracking-wider">Admin Panel</h2>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) => cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100"
              )}
            >
              <Icon className={cn("mr-3 h-5 w-5", "group-hover:scale-110 transition-transform")} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-4">
          <p className="text-xs font-medium text-brand-600 dark:text-brand-400 mb-1">System Status</p>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
            All systems operational
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
