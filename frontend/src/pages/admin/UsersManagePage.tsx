import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, User as UserIcon } from 'lucide-react';
import { usersApi } from '../../../api/users';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

const UsersManagePage: React.FC = () => {
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: usersApi.getAll,
  });

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Manage Users</h1>
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell>#{user.id}</TableCell>
                <TableCell className="font-medium flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-gray-500" />
                  </div>
                  {user.username}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center w-fit ${
                    user.role === 'admin' || user.role === 'superadmin' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {user.role === 'admin' || user.role === 'superadmin' ? <Shield className="mr-1 h-3 w-3" /> : null}
                    {user.role}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UsersManagePage;
