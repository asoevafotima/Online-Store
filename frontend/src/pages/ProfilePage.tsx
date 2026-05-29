import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, Mail, Phone, MapPin, ShieldCheck, Camera, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { usersApi } from '../../api/users';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToast } from '../../hooks/use-toast';

const profileSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(10),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsSubmitting(true);
      const updatedUser = await usersApi.updateMe(data);
      setUser(updatedUser);
      setIsEditing(false);
      toast({
        title: 'Profile Updated',
        description: 'Your profile information has been successfully updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.response?.data?.detail || 'Could not update profile',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return <div className="page-container py-20 text-center">Please log in.</div>;

  return (
    <div className="page-container py-12 max-w-4xl">
      <h1 className="text-3xl font-bold tracking-tight mb-8">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="glass-card p-6 flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white text-4xl font-bold border-4 border-white dark:border-gray-900 shadow-glow">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <button className="absolute bottom-0 right-0 w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md border border-gray-100 dark:border-gray-700 text-gray-500 hover:text-brand-500 transition-colors">
                <Camera className="h-5 w-5" />
              </button>
            </div>
            <h2 className="text-xl font-bold">{user.username}</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">{user.email}</p>
            
            <div className="w-full bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 text-left space-y-3">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <ShieldCheck className="h-4 w-4 mr-2 text-brand-500" />
                <span className="capitalize">{user.role} Account</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <MapPin className="h-4 w-4 mr-2 text-brand-500" />
                <span>San Francisco, CA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="md:col-span-2">
          <div className="glass-card p-8">
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
              <h2 className="text-xl font-bold">Personal Information</h2>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="username"
                      disabled={!isEditing}
                      {...register('username')}
                      className={`pl-9 ${errors.username ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.username && <p className="text-sm text-red-500">{errors.username.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      disabled={!isEditing}
                      {...register('email')}
                      className={`pl-9 ${errors.email ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      disabled={!isEditing}
                      {...register('phone')}
                      className={`pl-9 ${errors.phone ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
                  </Button>
                </div>
              )}
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
