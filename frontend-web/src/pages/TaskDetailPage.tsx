import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTaskStore } from '../stores/task.store';
import { useAuthStore } from '../stores/auth.store';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card } from '../components/common/Card';
import toast from 'react-hot-toast';
import {
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  StarIcon,
  ChevronLeftIcon,
  PaperClipIcon,
  UserCircleIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import type { TaskStatus } from '../types';

export const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentTask, fetchTaskById, submitBid, isLoading } = useTaskStore();
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTaskById(id);
    }
  }, [id]);

  const handleSubmitBid = async () => {
    if (!bidAmount || !bidMessage.trim()) {
      toast.error('Please enter both bid amount and message');
      return;
    }

    setIsSubmittingBid(true);
    try {
      await submitBid(id!, {
        amount: parseFloat(bidAmount),
        message: bidMessage,
      });
      toast.success('Bid submitted successfully!');
      setBidAmount('');
      setBidMessage('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit bid');
    } finally {
      setIsSubmittingBid(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto" />
          <p className="mt-4 text-dark-600">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (!currentTask) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center py-16">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-dark-900 mb-2">Task not found</h2>
          <p className="text-dark-600 mb-6">The task you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => navigate('/browse-tasks')}>Browse Tasks</Button>
        </Card>
      </div>
    );
  }

  const task = currentTask;
  const isOwner = user?.id === task.clientId;
  const isAssigned = task.status === 'ASSIGNED' || task.status === 'IN_PROGRESS' || task.status === 'COMPLETED';

  const getStatusColor = (status: string): { bg: string; text: string; border: string } => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      POSTED: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
      BIDDING: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
      ASSIGNED: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
      IN_PROGRESS: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
      COMPLETED: { bg: 'bg-dark-50', text: 'text-dark-700', border: 'border-dark-200' },
      CANCELLED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    };
    return colors[status] || colors.POSTED;
  };

  const statusStyle = getStatusColor(task.status);

  return (
    <div className="min-h-screen bg-dark-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 text-dark-600 hover:bg-dark-100"
          >
            <ChevronLeftIcon className="w-5 h-5 mr-2" />
            Back
          </Button>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl md:text-4xl font-bold text-dark-900">{task.title}</h1>
                <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-dark-600">
                Posted {new Date(task.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            {isOwner && (
              <Button onClick={() => navigate(`/tasks/${task.id}/edit`)}>
                Edit Task
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {task.imageUrls && task.imageUrls.length > 0 && (
              <Card>
                <h2 className="text-xl font-bold text-dark-900 mb-4">Photos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {task.imageUrls.map((url, index) => (
                    <img
                      key={url + index}
                      src={url}
                      alt={`Task ${index + 1}`}
                      className="w-full h-56 object-cover rounded-xl border"
                    />
                  ))}
                </div>
              </Card>
            )}
            {/* Description */}
            <Card>
              <h2 className="text-xl font-bold text-dark-900 mb-4">Description</h2>
              <p className="text-dark-700 whitespace-pre-line leading-relaxed">{task.description}</p>
            </Card>

            {/* Details */}
            <Card>
              <h2 className="text-xl font-bold text-dark-900 mb-4">Task Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-3">
                  <div className="p-3 bg-primary-50 rounded-xl">
                    <MapPinIcon className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-dark-500 mb-1">Location</p>
                    <p className="font-semibold text-dark-900">{task.location}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="p-3 bg-success-50 rounded-xl">
                    <CurrencyDollarIcon className="w-6 h-6 text-success-600" />
                  </div>
                  <div>
                    <p className="text-sm text-dark-500 mb-1">Budget</p>
                    <p className="font-semibold text-dark-900 text-lg">${task.budget?.toFixed(2) || 'Flexible'}</p>
                    {task.aiSuggestedPrice && (
                      <p className="text-sm text-dark-500">AI suggested: ${task.aiSuggestedPrice.toFixed(2)}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="p-3 bg-accent-50 rounded-xl">
                    <CalendarIcon className="w-6 h-6 text-accent-600" />
                  </div>
                  <div>
                    <p className="text-sm text-dark-500 mb-1">Deadline</p>
                    <p className="font-semibold text-dark-900">
                      {task.deadline ? new Date(task.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Flexible'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="p-3 bg-yellow-50 rounded-xl">
                    <ClockIcon className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-dark-500 mb-1">Category</p>
                    <p className="font-semibold text-dark-900">{task.category.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Client Info */}
            <Card>
              <h2 className="text-xl font-bold text-dark-900 mb-4">About the Client</h2>
              <div className="flex items-start gap-4">
                {task.client?.profilePhotoUrl ? (
                  <img
                    src={task.client.profilePhotoUrl}
                    alt={task.client.fullName}
                    className="w-16 h-16 rounded-2xl object-cover border"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {task.client?.fullName?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-dark-900 text-lg">{task.client?.fullName || 'Anonymous'}</p>
                  {task.client?.rating && (
                    <div className="flex items-center gap-2 mt-1 mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`w-5 h-5 ${
                              i < Math.floor(task.client?.rating || 0)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-dark-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-dark-600 font-medium">{task.client?.rating.toFixed(1) || 'N/A'}</span>
                    </div>
                  )}
                  <p className="text-dark-600 text-sm">
                    {task.client?.location || 'Location not specified'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Bid Section */}
            {!isOwner && !isAssigned && user?.role === 'PROVIDER' && (
              <Card className="border-2 border-primary-200 bg-primary-50/50">
                <div className="flex items-center gap-2 mb-4">
                  <CurrencyDollarIcon className="w-6 h-6 text-primary-600" />
                  <h2 className="text-lg font-bold text-dark-900">Submit Your Bid</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                      Your Price (USD)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder="50.00"
                      leftIcon={<CurrencyDollarIcon className="w-5 h-5" />}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">
                      Message to Client
                    </label>
                    <textarea
                      value={bidMessage}
                      onChange={(e) => setBidMessage(e.target.value)}
                      rows={4}
                      className="input-field resize-none"
                      placeholder="Tell the client why you're the best fit for this task..."
                    />
                  </div>

                  <Button
                    onClick={handleSubmitBid}
                    disabled={isSubmittingBid}
                    className="w-full"
                  >
                    {isSubmittingBid ? 'Submitting...' : 'Submit Bid'}
                  </Button>
                </div>
              </Card>
            )}

            {/* Task Stats */}
            <Card>
              <h2 className="text-lg font-bold text-dark-900 mb-4">Task Stats</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-dark-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <CurrencyDollarIcon className="w-5 h-5 text-primary-600" />
                    </div>
                    <span className="text-dark-600">Total Bids</span>
                  </div>
                  <span className="text-2xl font-bold text-dark-900">{task.bids?.length || 0}</span>
                </div>

                {task.matchingScore && (
                  <div className="flex items-center justify-between p-4 bg-success-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-success-100 rounded-lg">
                        <StarIcon className="w-5 h-5 text-success-600" />
                      </div>
                      <span className="text-dark-600">Matching Score</span>
                    </div>
                    <span className="text-2xl font-bold text-success-600">{task.matchingScore}%</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Quick Actions */}
            {user && !isOwner && (
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <PaperClipIcon className="w-5 h-5 mr-3" />
                  Save Task
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 mr-3" />
                  Contact Client
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
