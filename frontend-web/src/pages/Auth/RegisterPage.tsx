import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../stores/auth.store';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import toast from 'react-hot-toast';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';

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

  const getSignupErrorMessage = (error: any) => {
    const backendMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      'Registration failed. Please try again.';
    const normalized = String(backendMessage).toLowerCase();

    if (
      normalized.includes('email already') ||
      normalized.includes('already registered') ||
      normalized.includes('already exists')
    ) {
      return 'This email is already registered. Please use a different email.';
    }

    return backendMessage;
  };

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
      toast.error(getSignupErrorMessage(error));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent-500/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-500/30 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-xl mb-4">
            <span className="text-2xl font-bold text-primary-600">CMT</span>
          </div>
        </div>

        <Card className="shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-dark-900 mb-2">Create Account</h1>
            <p className="text-dark-600">Join our community of service providers and clients</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              {...register('fullName', { required: 'Full name is required' })}
              placeholder="Enter your full name"
              label="Full Name"
              error={errors.fullName?.message}
            />

            <Input
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Please enter a valid email address' },
              })}
              type="email"
              placeholder="your@email.com"
              label="Email"
              leftIcon={<EnvelopeIcon className="w-5 h-5" />}
              error={errors.email?.message}
            />

            <Input
              {...register('phone')}
              placeholder="Optional phone number"
              label="Phone Number (optional)"
            />

            <div>
              <label className="block text-sm font-medium text-dark-700 mb-3">
                I am a: *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['CLIENT', 'PROVIDER'].map((role) => (
                  <label
                    key={role}
                    className={`
                      flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${watch('role') === role
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-dark-200 hover:border-primary-300 text-dark-600'}
                    `}
                  >
                    <input
                      type="radio"
                      value={role}
                      {...register('role', { required: 'Please select a role' })}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">
                      {role === 'CLIENT' ? 'Task Poster' : 'Service Provider'}
                    </span>
                  </label>
                ))}
              </div>
              {errors.role && (
                <p className="text-sm text-danger-600 mt-2">
                  {errors.role.message}
                </p>
              )}
            </div>

            <Input
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
              type="password"
              placeholder="Create a password"
              label="Password"
              leftIcon={<LockClosedIcon className="w-5 h-5" />}
              error={errors.password?.message}
              helperText="At least 6 characters"
            />

            <Input
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) =>
                  value === password || 'Passwords do not match',
              })}
              type="password"
              placeholder="Confirm your password"
              label="Confirm Password"
              leftIcon={<LockClosedIcon className="w-5 h-5" />}
              error={errors.confirmPassword?.message}
            />

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2"
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-dark-600 text-sm mt-6">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
            >
              Sign in
            </button>
          </p>
        </Card>

        <p className="text-center text-white/70 text-sm mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};
