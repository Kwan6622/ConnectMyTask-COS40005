import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../stores/auth.store';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import toast from 'react-hot-toast';
import { EnvelopeIcon, LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';

interface SignupFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'CLIENT' | 'PROVIDER';
  phone?: string;
}

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuthStore();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = 
    useForm<SignupFormData>({
      defaultValues: {
        role: 'CLIENT',
      },
    });

  const password = watch('password');

  const onSubmit = async (data: SignupFormData) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      await registerUser({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        role: data.role,
        phone: data.phone,
      });
      toast.success('Registration successful!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <Card>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-dark-900">Create Account</h1>
            <p className="text-dark-600 mt-2">Join ConnectMyTask today</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <Input
              {...register('fullName', { required: 'Full name is required' })}
              placeholder="Full Name"
              icon={<UserIcon className="w-5 h-5" />}
              error={errors.fullName?.message}
            />

            {/* Email */}
            <Input
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              type="email"
              placeholder="Email Address"
              icon={<EnvelopeIcon className="w-5 h-5" />}
              error={errors.email?.message}
            />

            {/* Phone */}
            <Input
              {...register('phone')}
              placeholder="Phone Number (optional)"
            />

            {/* Role Selection */}
            <div>
              <label className="form-label">
                I want to be a:
              </label>
              <div className="flex gap-4">
                {['CLIENT', 'PROVIDER'].map((role) => (
                  <label key={role} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value={role}
                      {...register('role')}
                      className="w-4 h-4 text-primary-500"
                    />
                    <span className="ml-2 text-dark-700">
                      {role === 'CLIENT' ? 'Client' : 'Service Provider'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Password */}
            <Input
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
              })}
              type="password"
              placeholder="Password"
              icon={<LockClosedIcon className="w-5 h-5" />}
              error={errors.password?.message}
            />

            {/* Confirm Password */}
            <Input
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) =>
                  value === password || 'Passwords do not match',
              })}
              type="password"
              placeholder="Confirm Password"
              icon={<LockClosedIcon className="w-5 h-5" />}
              error={errors.confirmPassword?.message}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-6"
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          {/* Login Link */}
          <p className="text-center text-dark-600 mt-6">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Sign In
            </button>
          </p>
        </Card>
      </div>
    </div>
  );
};
