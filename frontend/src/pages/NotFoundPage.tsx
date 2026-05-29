import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center p-4 page-container my-12">
      <div className="w-full max-w-lg text-center animate-scale-in">
        <div className="w-24 h-24 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center mx-auto mb-8 text-brand-500">
          <AlertTriangle className="h-12 w-12" />
        </div>
        <h1 className="text-7xl font-extrabold gradient-text mb-4">404</h1>
        <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-8 max-w-md mx-auto">
          Oops! The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
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

export default NotFoundPage;
