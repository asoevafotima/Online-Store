import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';

const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center p-4 page-container my-12">
      <div className="w-full max-w-lg text-center animate-scale-in">
        <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-8 text-red-500">
          <ShieldAlert className="h-12 w-12" />
        </div>
        <h1 className="text-7xl font-extrabold text-red-500 mb-4">403</h1>
        <h2 className="text-3xl font-bold mb-4">Access Denied</h2>
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-8 max-w-md mx-auto">
          Sorry, you don't have permission to access this page. Please log in with an account that has the required privileges.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 rounded-full" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-5 w-5" /> Go Back
          </Button>
          <Link to="/">
            <Button size="lg" className="w-full sm:w-auto h-14 px-8 rounded-full shadow-glow">
              <Home className="mr-2 h-5 w-5" /> Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForbiddenPage;
