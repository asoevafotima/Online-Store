import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tags, Plus } from 'lucide-react';
import { categoriesApi } from '../../../api/categories';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

const CategoriesManagePage: React.FC = () => {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: categoriesApi.getAll,
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Manage Categories</h1>
        <Button className="shadow-glow"><Plus className="mr-2 h-4 w-4" /> Add Category</Button>
      </div>
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={2} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : categories?.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell>#{cat.id}</TableCell>
                <TableCell className="font-medium flex items-center gap-2">
                  <Tags className="h-4 w-4 text-brand-500" />
                  {cat.name}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CategoriesManagePage;
