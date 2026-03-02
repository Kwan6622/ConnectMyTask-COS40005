import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../stores/auth.store';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card } from '../components/common/Card';
import toast from 'react-hot-toast';
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  StarIcon,
  ArrowRightOnRectangleIcon,
  PencilSquareIcon,
  CheckBadgeIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

interface ProfileFormData {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  bio?: string;
  avatar?: string;
}

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, updateProfilePhoto } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState(user?.profilePhotoUrl || '');
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormData>({
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      location: user?.location || '',
      bio: '',
    },
  });

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleSavePhoto = async () => {
    if (!photoUrlInput.trim()) {
      toast.error('Please enter an image URL');
      return;
    }
    const nextUrl = photoUrlInput.trim();
    const looksLikeDirectImage =
      /^https?:\/\//i.test(nextUrl) &&
      /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i.test(nextUrl);
    if (!looksLikeDirectImage) {
      toast.error('Please use a direct image URL (ends with .jpg/.png/...)');
      return;
    }
    setIsSavingPhoto(true);
    try {
      await updateProfilePhoto(nextUrl);
      toast.success('Profile photo updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile photo');
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Profile updated successfully');
      setIsEditing(false);
      reset();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center py-16">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-dark-900 mb-2">Please log in</h2>
          <p className="text-dark-600 mb-6">You need to be logged in to view your profile.</p>
          <Button onClick={() => navigate('/login')}>Log In</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark-900">My Profile</h1>
          <p className="text-dark-600 mt-1">Manage your account and preferences</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card className="text-center">
              <div className="relative inline-block mb-4">
                {user.profilePhotoUrl ? (
                  <img
                    src={user.profilePhotoUrl}
                    alt={user.fullName}
                    className="w-24 h-24 mx-auto rounded-2xl object-cover shadow-xl"
                  />
                ) : (
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary-500 to-accent-600 rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-xl">
                    {user.fullName?.charAt(0).toUpperCase()}
                  </div>
                )}
                {user.isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-success-500 rounded-full p-1.5 shadow-lg">
                    <CheckBadgeIcon className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
              <div className="text-left mt-4 space-y-3">
                <label className="text-xs font-semibold text-dark-500">Profile Photo URL</label>
                <input
                  value={photoUrlInput}
                  onChange={(event) => setPhotoUrlInput(event.target.value)}
                  placeholder="https://res.cloudinary.com/..."
                  className="w-full px-3 py-2 border border-dark-200 rounded-lg text-sm"
                />
                <Button
                  onClick={handleSavePhoto}
                  disabled={isSavingPhoto}
                  className="w-full"
                >
                  {isSavingPhoto ? 'Saving...' : 'Save Photo URL'}
                </Button>
                <p className="text-xs text-dark-400">
                  Upload is disabled for now. Paste a direct image URL.
                </p>
              </div>
              <h2 className="text-xl font-bold text-dark-900 mb-1">{user.fullName}</h2>
              <p className="text-sm text-dark-600 mb-4">
                {user.role === 'CLIENT' ? 'Task Poster' : 'Service Provider'}
              </p>
              {user.rating && (
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(user.rating!)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-dark-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-dark-600 font-medium">{user.rating.toFixed(1)}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-dark-100">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary-600">{user.completedTasks || 0}</p>
                  <p className="text-xs text-dark-500">Tasks</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-success-600">98%</p>
                  <p className="text-xs text-dark-500">Success</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-accent-600">{user.completedTasks || 0}</p>
                  <p className="text-xs text-dark-500">Reviews</p>
                </div>
              </div>
            </Card>

            {/* Contact Info */}
            <Card>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-dark-600">
                  <div className="p-2 bg-primary-50 rounded-lg">
                    <EnvelopeIcon className="w-5 h-5 text-primary-600" />
                  </div>
                  <span className="text-sm break-all">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3 text-dark-600">
                    <div className="p-2 bg-success-50 rounded-lg">
                      <PhoneIcon className="w-5 h-5 text-success-600" />
                    </div>
                    <span className="text-sm">{user.phone}</span>
                  </div>
                )}
                {user.location && (
                  <div className="flex items-center gap-3 text-dark-600">
                    <div className="p-2 bg-accent-50 rounded-lg">
                      <MapPinIcon className="w-5 h-5 text-accent-600" />
                    </div>
                    <span className="text-sm">{user.location}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Actions */}
            <Card className="space-y-3">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full text-danger-600 border-danger-200 hover:bg-danger-50"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />
                Logout
              </Button>
            </Card>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <UserCircleIcon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h2 className="text-xl font-bold text-dark-900">Profile Information</h2>
                </div>
                {!isEditing && (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    <PencilSquareIcon className="w-5 h-5 mr-2" />
                    Edit
                  </Button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <Input
                    {...register('fullName', {
                      required: 'Full name is required',
                    })}
                    label="Full Name"
                    leftIcon={<UserCircleIcon className="w-5 h-5" />}
                    error={errors.fullName?.message}
                  />

                  <Input
                    {...register('email', {
                      required: 'Email is required',
                    })}
                    type="email"
                    label="Email"
                    leftIcon={<EnvelopeIcon className="w-5 h-5" />}
                    disabled
                    error={errors.email?.message}
                  />

                  <Input
                    {...register('phone')}
                    label="Phone Number"
                    leftIcon={<PhoneIcon className="w-5 h-5" />}
                    placeholder="+1 234 567 8900"
                    error={errors.phone?.message}
                  />

                  <Input
                    {...register('location')}
                    label="Location"
                    leftIcon={<MapPinIcon className="w-5 h-5" />}
                    placeholder="City, Country"
                    error={errors.location?.message}
                  />

                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      {...register('bio')}
                      rows={4}
                      className="input-field resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div className="flex gap-4 pt-6 border-t border-dark-100">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        reset();
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 p-4 bg-dark-50 rounded-xl">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <UserCircleIcon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm text-dark-500">Full Name</p>
                      <p className="font-semibold text-dark-900">{user.fullName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-dark-50 rounded-xl">
                    <div className="p-2 bg-success-100 rounded-lg">
                      <EnvelopeIcon className="w-5 h-5 text-success-600" />
                    </div>
                    <div>
                      <p className="text-sm text-dark-500">Email</p>
                      <p className="font-semibold text-dark-900">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-dark-50 rounded-xl">
                    <div className="p-2 bg-accent-100 rounded-lg">
                      <PhoneIcon className="w-5 h-5 text-accent-600" />
                    </div>
                    <div>
                      <p className="text-sm text-dark-500">Phone</p>
                      <p className="font-semibold text-dark-900">{user.phone || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-dark-50 rounded-xl">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <MapPinIcon className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-dark-500">Location</p>
                      <p className="font-semibold text-dark-900">{user.location || '-'}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-dark-50 rounded-xl">
                    <p className="text-sm text-dark-500 mb-2">Bio</p>
                    <p className="font-semibold text-dark-900">
                      No bio added yet. Click Edit to add a bio.
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
