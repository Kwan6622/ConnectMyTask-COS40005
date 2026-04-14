import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../stores/auth.store';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card } from '../components/common/Card';
import { uploadImageToCloudinary } from '../utils/cloudinaryUpload';
import { api } from '../services/api';
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
import type { ProviderCertificate, ProviderProfile, ProviderRatingSummary } from '../types';

interface ProfileFormData {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  bio?: string;
}

const emptyProviderProfile: ProviderProfile = {
  id: 'new',
  userId: 'me',
  specialties: [],
  safetyComplianceAgreed: false,
};

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, updateProfilePhoto } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [ratingSummary, setRatingSummary] = useState<{ averageRating: number; totalReviews: number } | null>(null);
  const [recentFeedback, setRecentFeedback] = useState<Array<{ id: string | number; comment?: string | null; fromUser?: { name?: string } }>>([]);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile>(emptyProviderProfile);
  const [providerCertificates, setProviderCertificates] = useState<ProviderCertificate[]>([]);
  const [certificateForm, setCertificateForm] = useState({ title: '', certificateType: '', fileUrl: '' });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormData>({
    defaultValues: {
      fullName: user?.fullName || user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      location: user?.location || '',
      bio: user?.bio || '',
    },
  });

  const isProvider = String(user?.role || '').toUpperCase() === 'PROVIDER';

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handlePhotoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
    setPhotoUploadError(null);
  };

  const handleSavePhoto = async () => {
    if (!selectedPhotoFile) {
      toast.error('Please choose a profile image');
      return;
    }

    setIsSavingPhoto(true);
    setPhotoUploadError(null);
    try {
      const secureUrl = await uploadImageToCloudinary(selectedPhotoFile);
      await updateProfilePhoto(secureUrl);
      setSelectedPhotoFile(null);
      setPhotoPreviewUrl(null);
      toast.success('Profile photo updated');
    } catch (error: any) {
      const message = error?.message || 'Failed to update profile photo';
      setPhotoUploadError(message);
      toast.error(message);
    } finally {
      setIsSavingPhoto(false);
    }
  };

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  useEffect(() => {
    if (!user?.id) return;
    api.users.getProfile(String(user.id))
      .then((response) => {
        const payload = response.data || {};
        const profile = payload.providerProfile || emptyProviderProfile;
        setProviderProfile({
          ...emptyProviderProfile,
          ...profile,
          specialties: profile.specialties || [],
          safetyComplianceAgreed: Boolean(profile.safetyComplianceAgreed),
        });
        setProviderCertificates(profile.certificates || []);

        const summary: ProviderRatingSummary | undefined = payload.providerRatingSummary;
        if (summary) {
          setRatingSummary({
            averageRating: Number(summary.averageRating || 0),
            totalReviews: Number(summary.totalReviews || 0),
          });
          setRecentFeedback((summary.latestComments || []).filter((item: any) => item.comment).slice(0, 5));
          return;
        }

        setRatingSummary(null);
        setRecentFeedback([]);
      })
      .catch(() => {
        setProviderProfile(emptyProviderProfile);
        setProviderCertificates([]);
      });
  }, [user?.id]);

  const onSubmit = async (_data: ProfileFormData) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      toast.success('Profile updated successfully');
      setIsEditing(false);
      reset();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const saveProviderTrustProfile = async () => {
    try {
      const response = await api.users.updateProviderProfile({
        address: providerProfile.address || '',
        district: providerProfile.district || '',
        city: providerProfile.city || '',
        specialties: providerProfile.specialties || [],
        safetyComplianceAgreed: Boolean(providerProfile.safetyComplianceAgreed),
        shortBio: providerProfile.shortBio || '',
      });
      const profile = response.data || {};
      setProviderProfile({
        ...providerProfile,
        ...profile,
        specialties: profile.specialties || [],
        safetyComplianceAgreed: Boolean(profile.safetyComplianceAgreed),
      });
      setProviderCertificates(profile.certificates || []);
      toast.success('Provider trust profile saved');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save provider profile');
    }
  };

  const uploadProviderCertificate = async () => {
    if (!certificateForm.title || !certificateForm.certificateType || !certificateForm.fileUrl) {
      toast.error('Please fill all certificate fields');
      return;
    }
    try {
      await api.users.uploadProviderCertificate(certificateForm);
      const refreshed = await api.users.getProfile(String(user?.id || ''));
      const profile = refreshed.data?.providerProfile || emptyProviderProfile;
      setProviderProfile({
        ...providerProfile,
        ...profile,
        specialties: profile.specialties || [],
        safetyComplianceAgreed: Boolean(profile.safetyComplianceAgreed),
      });
      setProviderCertificates(profile.certificates || []);
      setCertificateForm({ title: '', certificateType: '', fileUrl: '' });
      toast.success('Certificate uploaded. Waiting admin verification.');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to upload certificate');
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark-900">My Profile</h1>
          <p className="text-dark-600 mt-1">Manage your account, trust data, and certificates</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-6">
            <Card className="text-center">
              <div className="relative inline-block mb-4">
                {photoPreviewUrl ? (
                  <img src={photoPreviewUrl} alt="Profile preview" className="w-24 h-24 mx-auto rounded-2xl object-cover shadow-xl" />
                ) : user.profilePhotoUrl ? (
                  <img src={user.profilePhotoUrl} alt={user.fullName || user.name} className="w-24 h-24 mx-auto rounded-2xl object-cover shadow-xl" />
                ) : (
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary-500 to-accent-600 rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-xl">
                    {(user.fullName || user.name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                {user.isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-success-500 rounded-full p-1.5 shadow-lg">
                    <CheckBadgeIcon className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>

              <div className="text-left mt-4 space-y-3">
                <label className="text-xs font-semibold text-dark-500">Profile Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoFileChange}
                  className="w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-white hover:file:bg-blue-700"
                />
                <Button onClick={handleSavePhoto} disabled={isSavingPhoto || !selectedPhotoFile} className="w-full">
                  {isSavingPhoto ? 'Uploading...' : 'Upload Profile Photo'}
                </Button>
                {photoUploadError && <p className="text-xs text-red-600">{photoUploadError}</p>}
              </div>

              <h2 className="text-xl font-bold text-dark-900 mt-4 mb-1">{user.fullName || user.name}</h2>
              <p className="text-sm text-dark-600 mb-4">{isProvider ? 'Service Provider' : 'Task Requester'}</p>

              {(ratingSummary?.totalReviews || 0) > 0 && (
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`w-5 h-5 ${i < Math.floor(ratingSummary?.averageRating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-dark-300'}`}
                      />
                    ))}
                  </div>
                  <span className="text-dark-600 font-medium">
                    {(ratingSummary?.averageRating || 0).toFixed(1)} ({ratingSummary?.totalReviews || 0} reviews)
                  </span>
                </div>
              )}
            </Card>

            {recentFeedback.length > 0 && (
              <Card>
                <h3 className="text-sm font-semibold text-dark-700 mb-3">Latest Feedback</h3>
                <div className="space-y-3">
                  {recentFeedback.map((item) => (
                    <div key={String(item.id)} className="rounded-lg border border-dark-100 bg-dark-50 p-3">
                      <p className="text-sm text-dark-700">"{item.comment}"</p>
                      <p className="text-xs text-dark-500 mt-1">- {item.fromUser?.name || 'User'}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card className="space-y-4">
              <div className="flex items-center gap-3 text-dark-600">
                <EnvelopeIcon className="w-5 h-5 text-primary-600" />
                <span className="text-sm break-all">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-3 text-dark-600">
                  <PhoneIcon className="w-5 h-5 text-success-600" />
                  <span className="text-sm">{user.phone}</span>
                </div>
              )}
              {providerProfile?.district && (
                <div className="flex items-center gap-3 text-dark-600">
                  <MapPinIcon className="w-5 h-5 text-accent-600" />
                  <span className="text-sm">{providerProfile.district}{providerProfile.city ? `, ${providerProfile.city}` : ''}</span>
                </div>
              )}
            </Card>

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
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <PencilSquareIcon className="w-5 h-5 mr-2" />
                    Edit
                  </Button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <Input {...register('fullName', { required: 'Full name is required' })} label="Full Name" error={errors.fullName?.message} />
                  <Input {...register('email', { required: 'Email is required' })} type="email" label="Email" disabled error={errors.email?.message} />
                  <Input {...register('phone')} label="Phone Number" placeholder="+84 9xx xxx xxx" error={errors.phone?.message} />
                  <Input {...register('location')} label="Location" placeholder="City, Country" error={errors.location?.message} />
                  <div className="flex gap-4 pt-6 border-t border-dark-100">
                    <Button type="button" variant="outline" onClick={() => { setIsEditing(false); reset(); }} className="flex-1">Cancel</Button>
                    <Button type="submit" disabled={isLoading} className="flex-1">{isLoading ? 'Saving...' : 'Save Changes'}</Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-dark-50 rounded-xl">
                    <p className="text-sm text-dark-500">Full Name</p>
                    <p className="font-semibold text-dark-900">{user.fullName || user.name}</p>
                  </div>
                  <div className="p-4 bg-dark-50 rounded-xl">
                    <p className="text-sm text-dark-500">Email</p>
                    <p className="font-semibold text-dark-900">{user.email}</p>
                  </div>
                  <div className="p-4 bg-dark-50 rounded-xl">
                    <p className="text-sm text-dark-500">Phone</p>
                    <p className="font-semibold text-dark-900">{user.phone || '-'}</p>
                  </div>
                </div>
              )}

              {isProvider && (
                <div className="mt-8 border-t border-dark-100 pt-6">
                  <h3 className="text-lg font-semibold text-dark-900 mb-4">Provider Trust & Verification</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      label="Address"
                      value={providerProfile.address || ''}
                      onChange={(e) => setProviderProfile((prev) => ({ ...prev, address: e.target.value }))}
                    />
                    <Input
                      label="District"
                      value={providerProfile.district || ''}
                      onChange={(e) => setProviderProfile((prev) => ({ ...prev, district: e.target.value }))}
                    />
                    <Input
                      label="City"
                      value={providerProfile.city || ''}
                      onChange={(e) => setProviderProfile((prev) => ({ ...prev, city: e.target.value }))}
                    />
                    <Input
                      label="Specialties (comma separated)"
                      value={(providerProfile.specialties || []).join(', ')}
                      onChange={(e) => setProviderProfile((prev) => ({
                        ...prev,
                        specialties: e.target.value.split(',').map((item) => item.trim()).filter(Boolean),
                      }))}
                    />
                  </div>
                  <label className="mt-4 inline-flex items-center gap-2 text-sm text-dark-700">
                    <input
                      type="checkbox"
                      checked={Boolean(providerProfile.safetyComplianceAgreed)}
                      onChange={(e) => setProviderProfile((prev) => ({ ...prev, safetyComplianceAgreed: e.target.checked }))}
                    />
                    Agreed to workplace safety policy
                  </label>
                  <div className="mt-4">
                    <Button onClick={saveProviderTrustProfile}>Save Trust Profile</Button>
                  </div>

                  <div className="mt-8">
                    <h4 className="text-base font-semibold text-dark-900 mb-3">Upload Certificate</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        label="Title"
                        value={certificateForm.title}
                        onChange={(e) => setCertificateForm((prev) => ({ ...prev, title: e.target.value }))}
                      />
                      <Input
                        label="Type"
                        value={certificateForm.certificateType}
                        onChange={(e) => setCertificateForm((prev) => ({ ...prev, certificateType: e.target.value }))}
                      />
                      <Input
                        label="File URL"
                        value={certificateForm.fileUrl}
                        onChange={(e) => setCertificateForm((prev) => ({ ...prev, fileUrl: e.target.value }))}
                      />
                    </div>
                    <div className="mt-3">
                      <Button onClick={uploadProviderCertificate}>Upload</Button>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h4 className="text-base font-semibold text-dark-900 mb-3">Certificates</h4>
                    <div className="space-y-3">
                      {providerCertificates.length === 0 && <p className="text-sm text-dark-500">No certificates uploaded.</p>}
                      {providerCertificates.map((cert) => (
                        <div key={String(cert.id)} className="rounded-lg border border-dark-100 p-3 bg-dark-50">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium text-dark-900">{cert.title}</p>
                              <p className="text-sm text-dark-600">{cert.certificateType}</p>
                              <a href={cert.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">View document</a>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full border ${
                              cert.verificationStatus === 'VERIFIED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : cert.verificationStatus === 'REJECTED'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {cert.verificationStatus}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
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
