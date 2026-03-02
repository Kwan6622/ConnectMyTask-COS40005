import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../stores/auth.store';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card } from '../components/common/Card';
import toast from 'react-hot-toast';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';

interface LoginFormData {
  email: string;
  password: string;
}

interface SignupFormData extends LoginFormData {
  fullName: string;
  confirmPassword: string;
  role: 'CLIENT' | 'PROVIDER';
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register: signup } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  const loginForm = useForm<LoginFormData>();
  const signupForm = useForm<SignupFormData>();

  const from = (location.state as any)?.from?.pathname || '/';

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    setAuthMessage(null);
    try {
      await login(data.email, data.password);
      toast.success('Welcome back! Logged in successfully.');
      navigate(from, { replace: true });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        'Login failed. Please try again.';
      setAuthMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await signup({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        role: data.role,
      });
      toast.success('Account created successfully! Please log in.');
      setIsLogin(true);
      signupForm.reset();
    } catch (error: any) {
      toast.error(error.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 flex items-center justify-center px-4 py-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent-500/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-500/30 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-xl mb-4">
            <span className="text-2xl font-bold text-primary-600">CMT</span>
          </div>
        </div>

        <Card className="shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-dark-900 mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-dark-600">
              {isLogin
                ? 'Sign in to your ConnectMyTask account'
                : 'Join our community of service providers and clients'}
            </p>
          </div>

          {isLogin ? (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5">
              {authMessage && (
                <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
                  {authMessage}
                </div>
              )}
              <Input
                {...loginForm.register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Please enter a valid email address',
                  },
                })}
                type="email"
                placeholder="your@email.com"
                label="Email"
                leftIcon={<EnvelopeIcon className="w-5 h-5" />}
                error={loginForm.formState.errors.email?.message}
              />

              <Input
                {...loginForm.register('password', {
                  required: 'Password is required',
                })}
                type="password"
                placeholder="Enter your password"
                label="Password"
                leftIcon={<LockClosedIcon className="w-5 h-5" />}
                error={loginForm.formState.errors.password?.message}
              />

              <Button
                type="submit"
                className="w-full mt-2"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>

              <p className="text-center text-dark-600 text-sm">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false);
                    loginForm.reset();
                  }}
                  className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
                >
                  Sign up
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-5">
              <Input
                {...signupForm.register('fullName', {
                  required: 'Full name is required',
                  minLength: { value: 3, message: 'Name must be at least 3 characters' },
                })}
                placeholder="Enter your full name"
                label="Full Name"
                error={signupForm.formState.errors.fullName?.message}
              />

              <Input
                {...signupForm.register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Please enter a valid email address',
                  },
                })}
                type="email"
                placeholder="your@email.com"
                label="Email"
                leftIcon={<EnvelopeIcon className="w-5 h-5" />}
                error={signupForm.formState.errors.email?.message}
              />

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-3">
                  I am a: *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['CLIENT', 'PROVIDER'] as const).map((role) => (
                    <label
                      key={role}
                      className={`
                        flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all
                        ${
                          signupForm.watch('role') === role
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-dark-200 hover:border-primary-300 text-dark-600'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        value={role}
                        {...signupForm.register('role', {
                          required: 'Please select a role',
                        })}
                        className="sr-only"
                      />
                      <span className="text-sm font-medium">
                        {role === 'CLIENT' ? 'Task Poster' : 'Service Provider'}
                      </span>
                    </label>
                  ))}
                </div>
                {signupForm.formState.errors.role && (
                  <p className="text-sm text-danger-600 mt-2">
                    {signupForm.formState.errors.role.message}
                  </p>
                )}
              </div>

              <Input
                {...signupForm.register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' },
                })}
                type="password"
                placeholder="Create a password"
                label="Password"
                leftIcon={<LockClosedIcon className="w-5 h-5" />}
                error={signupForm.formState.errors.password?.message}
                helperText="At least 6 characters"
              />

              <Input
                {...signupForm.register('confirmPassword', {
                  required: 'Please confirm your password',
                })}
                type="password"
                placeholder="Confirm your password"
                label="Confirm Password"
                leftIcon={<LockClosedIcon className="w-5 h-5" />}
                error={signupForm.formState.errors.confirmPassword?.message}
              />

              <Button
                type="submit"
                className="w-full mt-2"
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>

              <p className="text-center text-dark-600 text-sm">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    signupForm.reset();
                  }}
                  className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}
        </Card>

        {/* Footer */}
        <p className="text-center text-white/70 text-sm mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};
