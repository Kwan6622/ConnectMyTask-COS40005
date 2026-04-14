import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowTrendingUpIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  PaperClipIcon,
  StarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { useAuthStore } from '../stores/auth.store';
import { useTaskStore } from '../stores/task.store';
import { api } from '../services/api';
import { formatVnd } from '../utils';

function formatStatus(status: string) {
  if (status === 'POSTED') return 'OPEN';
  return status.split('_').join(' ');
}

export const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const bidSectionRef = useRef<HTMLDivElement | null>(null);

  const { user } = useAuthStore();
  const {
    currentTask,
    isLoading,
    fetchTaskById,
    submitBid,
    saveTask,
    unsaveTask,
    fetchSavedTasks,
    savedTaskIds,
    assignProvider,
    cancelTaskByRequester,
  } = useTaskStore();

  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [bidEta, setBidEta] = useState('');
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isDepositingEscrow, setIsDepositingEscrow] = useState(false);
  const [isAssigningBidId, setIsAssigningBidId] = useState<number | null>(null);
  const [isCancellingTask, setIsCancellingTask] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [requesterRatingSummary, setRequesterRatingSummary] = useState<{ averageRating: number; totalReviews: number } | null>(null);
  const [providerRatingSummary, setProviderRatingSummary] = useState<{ averageRating: number; totalReviews: number } | null>(null);
  const [myRatingStatus, setMyRatingStatus] = useState<{ canRate: boolean; hasRated: boolean; toUserId?: number; reason?: string } | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewScore, setReviewScore] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTaskById(id);
    }
  }, [id, fetchTaskById]);

  useEffect(() => {
    if (!currentTask) return;
    const requesterId = currentTask.createdById || currentTask.clientId;
    const providerId = currentTask.assignedProviderId;

    if (requesterId) {
      api.ratings
        .getUserRatings(requesterId)
        .then((response) => {
          setRequesterRatingSummary({
            averageRating: Number(response.data?.averageRating || 0),
            totalReviews: Number(response.data?.totalReviews || 0),
          });
        })
        .catch(() => setRequesterRatingSummary(null));
    } else {
      setRequesterRatingSummary(null);
    }

    if (providerId) {
      api.ratings
        .getUserRatings(providerId)
        .then((response) => {
          setProviderRatingSummary({
            averageRating: Number(response.data?.averageRating || 0),
            totalReviews: Number(response.data?.totalReviews || 0),
          });
        })
        .catch(() => setProviderRatingSummary(null));
    } else {
      setProviderRatingSummary(null);
    }
  }, [currentTask]);

  useEffect(() => {
    if (user) {
      fetchSavedTasks();
    }
  }, [user, fetchSavedTasks]);

  useEffect(() => {
    if (!id || !user) {
      setMyRatingStatus(null);
      return;
    }
    api.ratings
      .getMyTaskRatingStatus(id)
      .then((response) => {
        setMyRatingStatus(response.data || null);
      })
      .catch(() => {
        setMyRatingStatus(null);
      });
  }, [id, user, currentTask?.status]);

  useEffect(() => {
    const paymentState = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');
    const role = String(user?.role || '').toUpperCase();
    const isRequesterRole = role === 'REQUESTER' || role === 'CLIENT';
    if (!id || !user || !isRequesterRole) return;

    if (paymentState === 'success' && sessionId) {
      api.payment
        .confirmSession(sessionId)
        .then(() => {
          toast.success('Payment successful');
          fetchTaskById(id);
          setSearchParams({}, { replace: true });
        })
        .catch((error: any) => {
          const message =
            error?.response?.data?.message || error?.message || 'Payment confirmation failed';
          toast.error(message);
        });
    } else if (paymentState === 'cancel') {
      toast.error('Payment was canceled');
      setSearchParams({}, { replace: true });
    }
  }, [fetchTaskById, id, searchParams, setSearchParams, user]);

  // Keep hook order stable across loading/not-found/success renders.
  const sortedBids = useMemo(() => {
    const bids = currentTask?.bids || [];
    return [...bids].sort(
      (a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime()
    );
  }, [currentTask?.bids]);

  if (!currentTask) {
    if (isLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-dark-600">Loading task details...</div>
        </div>
      );
    }
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center py-14">
          <h2 className="text-2xl font-bold text-dark-900 mb-2">Task not found</h2>
          <p className="text-dark-600 mb-6">The task may have been removed.</p>
          <Button onClick={() => navigate('/browse-tasks')}>Browse Tasks</Button>
        </Card>
      </div>
    );
  }

  const task = currentTask;
  const requester = task.createdBy || task.client;
  const isOwner = String(user?.id || '') === String(task.createdById || task.clientId || '');
  const userRole = String(user?.role || '').toUpperCase();
  const isProvider = userRole === 'PROVIDER';
  const isRequester = userRole === 'REQUESTER' || userRole === 'CLIENT';
  const isAssignedProvider = String(user?.id || '') === String(task.assignedProviderId || '');
  const isTaskSaved = savedTaskIds.some((savedId) => String(savedId) === String(task.id));
  const latestProgressUpdate = task.progressUpdates?.[0];
  const bidCount = task._count?.bids ?? task.bids?.length ?? 0;
  const maxBids = Math.min(Number(task.maxBids || 30), 100);
  const isBidLimitReached = bidCount >= maxBids || bidCount >= 100;
  const canBid = Boolean(
    user &&
      isProvider &&
      !isOwner &&
      ['OPEN', 'BIDDING'].includes(task.status) &&
      !isBidLimitReached
  );
  const canAssignProvider = Boolean(isOwner && ['OPEN', 'BIDDING'].includes(task.status));
  const canViewProgress = Boolean(task.assignedProviderId && (isOwner || isAssignedProvider));
  const canManageProgress = Boolean(
    isProvider && isAssignedProvider && ['ASSIGNED', 'IN_PROGRESS', 'PENDING_CONFIRMATION'].includes(task.status)
  );
  const canPay = Boolean(isOwner && ['COMPLETED', 'AWAITING_PAYMENT'].includes(task.status));
  const canDepositEscrow = Boolean(
    isOwner &&
      ['ASSIGNED', 'IN_PROGRESS', 'PENDING_CONFIRMATION', 'DISPUTED'].includes(task.status) &&
      ['NONE', 'PENDING_DEPOSIT'].includes(String(task.escrowStatus || 'NONE'))
  );
  const canOpenDispute = Boolean(
    user &&
      (isOwner || isAssignedProvider) &&
      ['ASSIGNED', 'IN_PROGRESS', 'PENDING_CONFIRMATION', 'COMPLETED', 'AWAITING_PAYMENT', 'DISPUTED'].includes(task.status)
  );
  const canRequestCancel = Boolean(
    isOwner && ['OPEN', 'BIDDING', 'ASSIGNED'].includes(task.status)
  );
  const isOverdue = Boolean(task.isOverdue && !['PAID', 'CANCELLED'].includes(task.status));
  const canLeaveReview = Boolean(
    user &&
      myRatingStatus?.canRate &&
      !myRatingStatus?.hasRated &&
      ['COMPLETED', 'AWAITING_PAYMENT', 'PAID'].includes(task.status)
  );

  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    OPEN: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    BIDDING: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    ASSIGNED: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    IN_PROGRESS: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    PENDING_CONFIRMATION: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    COMPLETED: { bg: 'bg-dark-50', text: 'text-dark-700', border: 'border-dark-200' },
    AWAITING_PAYMENT: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    PAID: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    DISPUTED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    CANCELLED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  };
  const statusStyle = statusColors[task.status] || statusColors.OPEN;

  const handleSubmitBid = async () => {
    if (!canBid) {
      toast.error('Only providers can submit bids for OPEN/BIDDING tasks');
      return;
    }
    const amount = Number(bidAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid offer amount');
      return;
    }
    setIsSubmittingBid(true);
    try {
      await submitBid(String(task.id), {
        amount,
        message: bidMessage.trim() || undefined,
        estimatedCompletionTime: bidEta.trim() || undefined,
      });
      setBidAmount('');
      setBidMessage('');
      setBidEta('');
      toast.success('Bid submitted successfully');
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to submit bid';
      toast.error(message);
    } finally {
      setIsSubmittingBid(false);
    }
  };

  const handleAssignProvider = async (bidId: number) => {
    setIsAssigningBidId(bidId);
    try {
      await assignProvider(String(task.id), bidId);
      toast.success('Provider assigned successfully');
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to assign provider';
      toast.error(message);
    } finally {
      setIsAssigningBidId(null);
    }
  };

  const handleSubmitReview = async () => {
    if (!id || !myRatingStatus?.toUserId) {
      toast.error('Cannot submit review for this task');
      return;
    }
    setIsSubmittingReview(true);
    try {
      await api.ratings.create({
        taskId: Number(id),
        toUserId: Number(myRatingStatus.toUserId),
        rating: reviewScore,
        comment: reviewComment.trim() || undefined,
      });
      toast.success('Review submitted successfully');
      setShowReviewModal(false);
      setReviewComment('');
      setMyRatingStatus((prev) => (prev ? { ...prev, hasRated: true } : prev));
      const response = await api.ratings.getMyTaskRatingStatus(id);
      setMyRatingStatus(response.data || null);
      if (currentTask?.createdById) {
        const requesterResponse = await api.ratings.getUserRatings(currentTask.createdById);
        setRequesterRatingSummary({
          averageRating: Number(requesterResponse.data?.averageRating || 0),
          totalReviews: Number(requesterResponse.data?.totalReviews || 0),
        });
      }
      if (currentTask?.assignedProviderId) {
        const providerResponse = await api.ratings.getUserRatings(currentTask.assignedProviderId);
        setProviderRatingSummary({
          averageRating: Number(providerResponse.data?.averageRating || 0),
          totalReviews: Number(providerResponse.data?.totalReviews || 0),
        });
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to submit review';
      toast.error(message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handlePayNow = async () => {
    if (!isRequester) {
      toast.error('Only requester can pay');
      return;
    }
    setIsProcessingPayment(true);
    try {
      const response = await api.payment.create({
        taskId: Number(task.id),
        method: 'STRIPE',
      });
      const paymentUrl = response.data?.paymentUrl;
      if (!paymentUrl) throw new Error('No payment URL returned');
      window.location.href = paymentUrl;
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to start payment';
      toast.error(message);
      setIsProcessingPayment(false);
    }
  };

  const handleDepositEscrow = async () => {
    if (!isRequester) {
      toast.error('Only requester can deposit escrow');
      return;
    }
    setIsDepositingEscrow(true);
    try {
      const response = await api.payment.create({
        taskId: Number(task.id),
        method: 'STRIPE',
        flow: 'ESCROW_DEPOSIT',
      });
      const paymentUrl = response.data?.paymentUrl;
      if (!paymentUrl) throw new Error('No payment URL returned');
      window.location.href = paymentUrl;
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to create escrow deposit';
      toast.error(message);
      setIsDepositingEscrow(false);
    }
  };

  const handleToggleSave = async () => {
    try {
      if (isTaskSaved) {
        await unsaveTask(String(task.id));
        toast.success('Task removed from saved list');
      } else {
        await saveTask(String(task.id));
        toast.success('Task saved');
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to update saved task';
      toast.error(message);
    }
  };

  const handleContactClient = () => {
    if (!canBid) {
      toast.error('Only providers can contact requester via bidding on OPEN/BIDDING tasks');
      return;
    }
    bidSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast.success('Send your proposal in the bid form');
  };

  const handleCancelTask = async () => {
    const reason = cancelReason.trim();
    if (reason.length < 3) {
      toast.error('Please provide a short cancellation reason');
      return;
    }
    setIsCancellingTask(true);
    try {
      await cancelTaskByRequester(String(task.id), reason);
      toast.success('Task canceled successfully');
      setShowCancelModal(false);
      setCancelReason('');
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to cancel task';
      toast.error(message);
    } finally {
      setIsCancellingTask(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ChevronLeftIcon className="w-5 h-5 mr-2" />
            Back
          </Button>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-dark-900">{task.title}</h1>
              <p className="text-dark-600 mt-1">
                Posted {new Date(task.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isOverdue && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border bg-red-50 text-red-700 border-red-200">
                  Overdue
                </span>
              )}
              <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                {formatStatus(task.status)}
              </span>
            </div>
          </div>
        </div>

        {task.isSuspicious && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 mt-0.5" />
              <div>
                <h2 className="text-base font-bold text-amber-800">Potential scam risk</h2>
                <p className="text-sm text-amber-700 mt-1">
                  Warning: This task may be suspicious because the offered budget is unusually low for this type of work.
                </p>
                <p className="text-sm text-amber-700 mt-1 font-medium">
                  Reason: {task.suspiciousReason || 'Budget is unusually low for this type of job'}
                </p>
                {task.riskLevel && (
                  <p className="text-xs text-amber-800 mt-1 uppercase tracking-wide">
                    Risk level: {task.riskLevel}
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {task.imageUrls && task.imageUrls.length > 0 && (
              <Card>
                <h2 className="text-xl font-bold text-dark-900 mb-4">Task Photos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {task.imageUrls.map((url, index) => (
                    <img
                      key={`${url}-${index}`}
                      src={url}
                      alt={`Task image ${index + 1}`}
                      className="w-full h-56 object-cover rounded-xl border"
                    />
                  ))}
                </div>
              </Card>
            )}

            <Card>
              <h2 className="text-xl font-bold text-dark-900 mb-4">Description</h2>
              <p className="text-dark-700 whitespace-pre-line">{task.description}</p>
            </Card>

            <Card>
              <h2 className="text-xl font-bold text-dark-900 mb-4">Task Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary-50 rounded-lg">
                    <MapPinIcon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-dark-500">Location</p>
                    <p className="font-semibold text-dark-900">{task.location}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-success-50 rounded-lg">
                    <CurrencyDollarIcon className="w-5 h-5 text-success-600" />
                  </div>
                  <div>
                    <p className="text-sm text-dark-500">Budget</p>
                    <p className="font-semibold text-dark-900">{task.budget != null ? formatVnd(task.budget) : 'Flexible'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-accent-50 rounded-lg">
                    <CalendarIcon className="w-5 h-5 text-accent-600" />
                  </div>
                  <div>
                    <p className="text-sm text-dark-500">Deadline</p>
                    <p className="font-semibold text-dark-900">
                      {task.dueDate || task.deadline
                        ? new Date(task.dueDate || task.deadline || '').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                        : 'Flexible'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-yellow-50 rounded-lg">
                    <ClockIcon className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-dark-500">Category</p>
                    <p className="font-semibold text-dark-900">{task.category.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>
            </Card>

            {task.subtasks && task.subtasks.length > 0 && (
              <Card>
                <h2 className="text-xl font-bold text-dark-900 mb-4">Subtask Checklist</h2>
                <div className="space-y-2">
                  {task.subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center justify-between rounded-lg border border-dark-100 px-3 py-2">
                      <p className="text-sm text-dark-800">{subtask.title}</p>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-dark-100 text-dark-700">
                        {subtask.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card>
              <h2 className="text-xl font-bold text-dark-900 mb-4">Posted by</h2>
              <div className="flex items-start gap-4">
                {requester?.profilePhotoUrl ? (
                  <img
                    src={requester.profilePhotoUrl}
                    alt={requester.fullName || requester.name || 'Requester'}
                    className="w-16 h-16 rounded-2xl object-cover border"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 text-white flex items-center justify-center text-xl font-bold">
                    {(requester?.fullName || requester?.name || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-dark-900 text-lg">{requester?.fullName || requester?.name || 'Anonymous'}</p>
                  {requester?.phone && <p className="text-dark-600">Phone: {requester.phone}</p>}
                  <div className="flex items-center gap-1 mt-2">
                    <StarIcon className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm text-dark-700 font-semibold">
                      {(requesterRatingSummary?.averageRating ?? requester?.rating ?? 0).toFixed(1)}
                    </span>
                    <span className="text-sm text-dark-500">
                      ({requesterRatingSummary?.totalReviews ?? 0} reviews)
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {isOwner && (
              <Card>
                <h2 className="text-xl font-bold text-dark-900 mb-4">Bids Received</h2>
                {sortedBids.length === 0 ? (
                  <p className="text-dark-600">No bids yet. Task remains OPEN.</p>
                ) : (
                  <div className="space-y-4">
                    {sortedBids.map((bid) => (
                      <div key={bid.id} className="border rounded-xl p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-dark-900">
                              {bid.provider?.fullName || bid.provider?.name || 'Provider'}
                            </p>
                            <p className="text-sm text-dark-600">Your Offer: {formatVnd(Number((bid as any).price ?? bid.amount ?? 0))}</p>
                            {bid.message && <p className="text-sm text-dark-600 mt-1">{bid.message}</p>}
                            {(bid as any).estimatedCompletionTime && (
                              <p className="text-sm text-dark-500 mt-1">ETA: {(bid as any).estimatedCompletionTime}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-dark-100 text-dark-700">
                              {bid.status}
                            </span>
                            {canAssignProvider && bid.status !== 'ACCEPTED' && (
                              <Button
                                size="sm"
                                onClick={() => handleAssignProvider(Number(bid.id))}
                                disabled={isAssigningBidId === Number(bid.id)}
                              >
                                {isAssigningBidId === Number(bid.id) ? 'Assigning...' : 'Assign'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-bold text-dark-900 mb-4">Task Stats</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-dark-600">Status</span>
                  <span className="font-semibold text-dark-900">{formatStatus(task.status)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-600">Bid slots</span>
                  <span className="font-semibold text-dark-900">{bidCount} / {maxBids}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-600">Bidding</span>
                  <span className={`font-semibold ${isBidLimitReached ? 'text-red-700' : 'text-emerald-700'}`}>
                    {isBidLimitReached ? 'Closed' : 'Open'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-600">Escrow</span>
                  <span className="font-semibold text-dark-900">{task.escrowStatus || 'NONE'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-600">Payment</span>
                  <span className="font-semibold text-dark-900">{task.paymentStatus || 'UNPAID'}</span>
                </div>
                {task.assignedProvider && (
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-600">Assigned provider</span>
                    <span className="font-semibold text-dark-900">{task.assignedProvider.name}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-dark-600">Progress</span>
                  <span className="font-semibold text-dark-900">
                    {latestProgressUpdate?.progressPercent ?? 0}%
                  </span>
                </div>
                {latestProgressUpdate?.estimatedCompletionDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-600">Estimated completion</span>
                    <span className="font-semibold text-dark-900">
                      {new Date(latestProgressUpdate.estimatedCompletionDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {task.assignedProvider && (
              <Card>
                <h2 className="text-lg font-bold text-dark-900 mb-3">Assigned Provider</h2>
                <p className="font-semibold text-dark-900">{task.assignedProvider.name}</p>
                <p className="text-sm text-dark-600 mt-1">
                  ⭐ {(providerRatingSummary?.averageRating ?? task.assignedProvider.rating ?? 0).toFixed(1)} ({providerRatingSummary?.totalReviews ?? 0} reviews)
                </p>
                {(task.assignedProvider.providerProfile?.specialties || []).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(task.assignedProvider.providerProfile?.specialties || []).map((item: string) => (
                      <span key={item} className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                        {item}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs mt-3 text-dark-600">
                  Safety compliance: <span className={task.assignedProvider.providerProfile?.safetyComplianceAgreed ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                    {task.assignedProvider.providerProfile?.safetyComplianceAgreed ? 'Agreed' : 'Not agreed yet'}
                  </span>
                </p>
                {(task.assignedProvider.providerProfile?.certificates || []).length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold text-dark-700">Certificates</p>
                    {(task.assignedProvider.providerProfile?.certificates || []).slice(0, 3).map((cert: any) => (
                      <div key={String(cert.id)} className="rounded-lg border border-dark-100 bg-dark-50 px-2 py-1.5 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-dark-800">{cert.title}</span>
                          <span className={`px-1.5 py-0.5 rounded-full border ${
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
                )}
              </Card>
            )}

            {canLeaveReview && (
              <Card>
                <h2 className="text-lg font-bold text-dark-900 mb-3">Leave a Review</h2>
                <p className="text-sm text-dark-600 mb-4">
                  Share your feedback for this completed task.
                </p>
                <Button className="w-full" onClick={() => setShowReviewModal(true)}>
                  Leave a Review
                </Button>
              </Card>
            )}

            {canViewProgress && (
              <Card>
                <h2 className="text-lg font-bold text-dark-900 mb-3">Task Progress Tracking</h2>
                <div className="mb-4">
                  <div className="w-full h-2 rounded-full bg-dark-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-accent-500"
                      style={{ width: `${Math.max(0, Math.min(100, latestProgressUpdate?.progressPercent ?? 0))}%` }}
                    />
                  </div>
                  <p className="text-sm text-dark-600 mt-2">
                    Latest progress: {latestProgressUpdate?.progressPercent ?? 0}%
                  </p>
                  {latestProgressUpdate?.note && (
                    <p className="text-sm text-dark-600 mt-2 line-clamp-2">{latestProgressUpdate.note}</p>
                  )}
                </div>
                <Button
                  variant={canManageProgress ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => navigate(`/tasks/${task.id}/progress`)}
                >
                  <ArrowTrendingUpIcon className="w-5 h-5 mr-3" />
                  {canManageProgress ? 'Update Progress' : 'View Progress'}
                </Button>
              </Card>
            )}

            {(canDepositEscrow || canPay) && (
              <Card>
                <h2 className="text-lg font-bold text-dark-900 mb-3">Payment & Escrow</h2>
                <p className="text-sm text-dark-600 mb-4">
                  Escrow status: <span className="font-semibold text-dark-900">{task.escrowStatus || 'NONE'}</span>
                  {' '}| Payment status: <span className="font-semibold text-dark-900">{task.paymentStatus || 'UNPAID'}</span>
                </p>
                {canDepositEscrow && (
                  <Button className="w-full mb-2" onClick={handleDepositEscrow} disabled={isDepositingEscrow}>
                    {isDepositingEscrow ? 'Redirecting...' : 'Deposit Escrow'}
                  </Button>
                )}
                {canPay && (
                  <Button variant={canDepositEscrow ? 'outline' : 'default'} className="w-full" onClick={handlePayNow} disabled={isProcessingPayment}>
                    {isProcessingPayment ? 'Redirecting...' : 'Pay Now'}
                  </Button>
                )}
              </Card>
            )}

            {user && !isOwner && (
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={handleToggleSave}>
                  <PaperClipIcon className="w-5 h-5 mr-3" />
                  {isTaskSaved ? 'Saved' : 'Save Task'}
                </Button>
                {canBid && (
                  <Button variant="outline" className="w-full justify-start" onClick={handleContactClient}>
                    <ChatBubbleLeftRightIcon className="w-5 h-5 mr-3" />
                    Contact Client
                  </Button>
                )}
              </div>
            )}

            {canOpenDispute && (
              <Card>
                <h2 className="text-lg font-bold text-dark-900 mb-3">Dispute & Resolution</h2>
                <p className="text-sm text-dark-600 mb-4">
                  Use Progress Tracking to open dispute, upload evidence, and follow admin review updates.
                </p>
                <Button variant="outline" className="w-full" onClick={() => navigate(`/tasks/${task.id}/progress`)}>
                  Open Progress & Dispute Center
                </Button>
              </Card>
            )}

            {canBid && (
              <div ref={bidSectionRef}>
                <Card>
                  <h2 className="text-lg font-bold text-dark-900 mb-4">Place Bid</h2>
                  <div className="space-y-4">
                    <Input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder="Your offer amount"
                      leftIcon={<CurrencyDollarIcon className="w-5 h-5" />}
                    />
                    <Input
                      type="text"
                      value={bidEta}
                      onChange={(e) => setBidEta(e.target.value)}
                      placeholder="Estimated completion time (optional)"
                    />
                    <textarea
                      value={bidMessage}
                      onChange={(e) => setBidMessage(e.target.value)}
                      rows={4}
                      className="input-field resize-none"
                      placeholder="Proposal message (optional)"
                    />
                    <Button className="w-full" onClick={handleSubmitBid} disabled={isSubmittingBid}>
                      {isSubmittingBid ? 'Submitting...' : 'Place Bid'}
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {isBidLimitReached && (
              <Card>
                <p className="text-sm font-semibold text-red-700">Bidding closed: this task has reached its bid limit.</p>
              </Card>
            )}

            {isOwner && task.status === 'PENDING_CONFIRMATION' && (
              <Card>
                <h2 className="text-lg font-bold text-dark-900 mb-3">Requester Action</h2>
                <p className="text-sm text-dark-600 mb-4">
                  Provider marked this task as completed. Review timeline and confirm in Progress Tracking.
                </p>
                <Button className="w-full" onClick={() => navigate(`/tasks/${task.id}/progress`)}>
                  Open Progress Tracking
                </Button>
              </Card>
            )}

            {canRequestCancel && (
              <Card>
                <h2 className="text-lg font-bold text-dark-900 mb-3">Cancel Task</h2>
                <p className="text-sm text-dark-600 mb-4">
                  Requester can cancel before work starts. If work already started, open dispute instead.
                </p>
                <Button variant="outline" className="w-full border-red-300 text-red-700 hover:bg-red-50" onClick={() => setShowCancelModal(true)}>
                  Cancel Task
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
      <Modal
        isOpen={showCancelModal}
        onClose={() => {
          if (isCancellingTask) return;
          setShowCancelModal(false);
        }}
        title="Cancel Task"
        footer={(
          <>
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(false)}
              disabled={isCancellingTask}
            >
              Keep Task
            </Button>
            <Button
              onClick={handleCancelTask}
              disabled={isCancellingTask}
              className="bg-red-600 hover:bg-red-700 border-red-600"
            >
              {isCancellingTask ? 'Cancelling...' : 'Confirm Cancel'}
            </Button>
          </>
        )}
      >
        <p className="text-sm text-dark-600 mb-3">
          Please add a short reason for cancellation. This will be visible in task history.
        </p>
        <textarea
          value={cancelReason}
          onChange={(event) => setCancelReason(event.target.value)}
          rows={4}
          className="w-full rounded-xl border border-dark-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          placeholder="Example: No longer needed because schedule changed"
        />
      </Modal>
      <Modal
        isOpen={showReviewModal}
        onClose={() => {
          if (isSubmittingReview) return;
          setShowReviewModal(false);
        }}
        title="Leave a Review"
        footer={(
          <>
            <Button
              variant="outline"
              onClick={() => setShowReviewModal(false)}
              disabled={isSubmittingReview}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={isSubmittingReview}
            >
              {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-dark-600 mb-2">Your rating</p>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewScore(star)}
                  className="focus:outline-none"
                >
                  <StarIcon
                    className={`w-7 h-7 ${star <= reviewScore ? 'fill-yellow-400 text-yellow-400' : 'text-dark-300'}`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-dark-600 mb-2">Feedback (optional)</p>
            <textarea
              value={reviewComment}
              onChange={(event) => setReviewComment(event.target.value)}
              rows={4}
              maxLength={500}
              className="w-full rounded-xl border border-dark-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Example: Very professional and on time."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
