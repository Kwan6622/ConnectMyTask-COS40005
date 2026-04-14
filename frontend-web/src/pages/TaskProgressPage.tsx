import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  ShieldExclamationIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { useAuthStore } from '../stores/auth.store';
import { useTaskStore } from '../stores/task.store';
import { api } from '../services/api';
import { formatDate, formatRelativeTime } from '../utils';
import { uploadImageToCloudinary } from '../utils/cloudinaryUpload';

const statusStyle: Record<string, { dot: string; chip: string; label: string }> = {
  ASSIGNED: {
    dot: 'bg-emerald-500',
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    label: 'Assigned',
  },
  IN_PROGRESS: {
    dot: 'bg-indigo-500',
    chip: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    label: 'In Progress',
  },
  PENDING_CONFIRMATION: {
    dot: 'bg-amber-500',
    chip: 'bg-amber-50 text-amber-700 border-amber-200',
    label: 'Pending Confirmation',
  },
  COMPLETED: {
    dot: 'bg-slate-600',
    chip: 'bg-slate-100 text-slate-700 border-slate-300',
    label: 'Completed',
  },
  AWAITING_PAYMENT: {
    dot: 'bg-orange-500',
    chip: 'bg-orange-50 text-orange-700 border-orange-200',
    label: 'Awaiting Payment',
  },
  PAID: {
    dot: 'bg-teal-500',
    chip: 'bg-teal-50 text-teal-700 border-teal-200',
    label: 'Paid',
  },
  DISPUTED: {
    dot: 'bg-rose-500',
    chip: 'bg-rose-50 text-rose-700 border-rose-200',
    label: 'Disputed',
  },
  CANCELLED: {
    dot: 'bg-red-500',
    chip: 'bg-red-50 text-red-700 border-red-200',
    label: 'Cancelled',
  },
};

function normalizeStatusLabel(status?: string) {
  if (!status) return 'Unknown';
  return statusStyle[status]?.label || status.split('_').join(' ');
}

export const TaskProgressPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { user } = useAuthStore();
  const {
    currentTask,
    taskProgressUpdates,
    taskSubtasks,
    taskProgressSummary,
    taskDisputes,
    taskActivityLogs,
    taskPaymentTransactions,
    taskPaymentSummary,
    fetchTaskProgress,
    addTaskProgressUpdate,
    updateTaskSubtaskStatus,
    confirmTaskCompletion,
    openTaskDispute,
    cancelTaskByRequester,
    isLoading,
  } = useTaskStore();

  const [progressPercent, setProgressPercent] = useState('');
  const [note, setNote] = useState('');
  const [milestoneStatus, setMilestoneStatus] = useState('');
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState('');
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [markAsCompleted, setMarkAsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDepositingEscrow, setIsDepositingEscrow] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancellingTask, setIsCancellingTask] = useState(false);
  const [disputeReason, setDisputeReason] = useState<'PROVIDER_NOT_DELIVERING' | 'REQUESTER_NOT_CONFIRMING' | 'QUALITY_ISSUE' | 'PAYMENT_ISSUE' | 'OTHER'>('QUALITY_ISSUE');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [disputeEvidenceFiles, setDisputeEvidenceFiles] = useState<File[]>([]);
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
  const [updatingSubtaskId, setUpdatingSubtaskId] = useState<string | number | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!id) return;
    fetchTaskProgress(id).catch((error: any) => {
      const message = error?.response?.data?.message || 'Failed to load task progress';
      toast.error(message);
      navigate('/browse-tasks');
    });
  }, [fetchTaskProgress, id, navigate, user]);

  useEffect(() => {
    if (!taskProgressSummary) return;
    setProgressPercent(String(taskProgressSummary.progressPercent || 0));
    setMilestoneStatus(taskProgressSummary.milestoneStatus || '');
    setEstimatedCompletionDate(
      taskProgressSummary.estimatedCompletionDate
        ? new Date(taskProgressSummary.estimatedCompletionDate).toISOString().slice(0, 10)
        : ''
    );
  }, [taskProgressSummary]);

  useEffect(() => {
    const escrowState = searchParams.get('escrow');
    const paymentState = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');
    if (!id || !user) return;

    if ((escrowState === 'success' || paymentState === 'success') && sessionId) {
      api.payment
        .confirmSession(sessionId)
        .then(() => {
          toast.success(escrowState === 'success' ? 'Escrow deposit confirmed' : 'Payment successful');
          fetchTaskProgress(id);
          setSearchParams({}, { replace: true });
        })
        .catch((error: any) => {
          const message =
            error?.response?.data?.message || error?.message || 'Failed to confirm payment session';
          toast.error(message);
        });
      return;
    }

    if (escrowState === 'cancel' || paymentState === 'cancel') {
      toast.error('Payment was canceled');
      setSearchParams({}, { replace: true });
    }
  }, [fetchTaskProgress, id, searchParams, setSearchParams, user]);

  const role = String(user?.role || '').toUpperCase();
  const isRequester = role === 'REQUESTER' || role === 'CLIENT';
  const isProvider = role === 'PROVIDER';
  const isOwner = String(user?.id || '') === String(currentTask?.createdById || '');
  const isAssignedProvider = String(user?.id || '') === String(currentTask?.assignedProviderId || '');
  const canViewProgress = Boolean(currentTask && (isOwner || isAssignedProvider));
  const canManageProgress = Boolean(
    isProvider &&
      isAssignedProvider &&
      currentTask &&
      ['ASSIGNED', 'IN_PROGRESS', 'PENDING_CONFIRMATION'].includes(currentTask.status)
  );
  const canConfirmCompletion = Boolean(isRequester && isOwner && currentTask?.status === 'PENDING_CONFIRMATION');
  const canDepositEscrow = Boolean(
    isRequester &&
      isOwner &&
      currentTask &&
      ['ASSIGNED', 'IN_PROGRESS', 'PENDING_CONFIRMATION', 'DISPUTED'].includes(currentTask.status) &&
      ['NONE', 'PENDING_DEPOSIT'].includes(String(currentTask.escrowStatus || 'NONE'))
  );
  const canOpenDispute = Boolean(
    currentTask &&
      (isOwner || isAssignedProvider) &&
      ['ASSIGNED', 'IN_PROGRESS', 'PENDING_CONFIRMATION', 'COMPLETED', 'AWAITING_PAYMENT', 'DISPUTED'].includes(currentTask.status)
  );
  const canRequestCancel = Boolean(
    isRequester && isOwner && currentTask && ['OPEN', 'BIDDING', 'ASSIGNED'].includes(currentTask.status)
  );
  const hasOpenDispute = taskDisputes.some((item) => ['OPEN', 'UNDER_REVIEW'].includes(item.status));
  const isOverdue = Boolean(currentTask?.isOverdue && !['PAID', 'CANCELLED'].includes(String(currentTask?.status || '')));

  useEffect(() => {
    if (!id || !canViewProgress) return;
    const timer = window.setInterval(() => {
      fetchTaskProgress(id).catch(() => {
        // keep silent during background refresh
      });
    }, 15000);
    return () => window.clearInterval(timer);
  }, [canViewProgress, fetchTaskProgress, id]);

  const summaryProgress = Math.max(0, Math.min(100, taskProgressSummary?.progressPercent ?? 0));
  const doneSubtasks = taskProgressSummary?.completedSubtasks ?? taskSubtasks.filter((item) => item.status === 'DONE').length;
  const totalSubtasks = taskProgressSummary?.totalSubtasks ?? taskSubtasks.length;
  const statusMeta = statusStyle[currentTask?.status || ''] || {
    dot: 'bg-slate-400',
    chip: 'bg-slate-50 text-slate-700 border-slate-200',
    label: normalizeStatusLabel(currentTask?.status),
  };

  const allAttachments = useMemo(
    () =>
      taskProgressUpdates.flatMap((item) =>
        (item.attachments || []).map((url, index) => ({
          url,
          key: `${item.id}-${index}`,
          createdAt: item.createdAt,
        }))
      ),
    [taskProgressUpdates]
  );

  const handleSubmitProgress = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id || !canManageProgress) {
      toast.error('Only assigned provider can update progress');
      return;
    }

    const parsedProgress = Number(progressPercent);
    if (!Number.isInteger(parsedProgress) || parsedProgress < 0 || parsedProgress > 100) {
      toast.error('Progress percent must be an integer from 0 to 100');
      return;
    }

    if (!note.trim()) {
      toast.error('Please add a work summary note');
      return;
    }

    setIsSubmitting(true);
    try {
      if (markAsCompleted && parsedProgress !== 100) {
        toast.error('Set progress to 100% before marking this task as completed');
        setIsSubmitting(false);
        return;
      }

      const attachmentUrls = proofFiles.length
        ? await Promise.all(proofFiles.map((file) => uploadImageToCloudinary(file)))
        : [];

      await addTaskProgressUpdate(id, {
        progressPercent: parsedProgress,
        note: note.trim(),
        attachments: attachmentUrls,
        milestoneStatus: milestoneStatus.trim() || undefined,
        estimatedCompletionDate: estimatedCompletionDate || undefined,
        markAsCompleted,
      });

      setNote('');
      setProofFiles([]);
      setMarkAsCompleted(false);
      toast.success(
        markAsCompleted
          ? 'Marked as completed. Waiting requester confirmation.'
          : 'Progress update posted'
      );
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to update progress';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSubtaskStatus = async (subtaskId: string | number, status: 'PENDING' | 'IN_PROGRESS' | 'DONE') => {
    if (!id || !canManageProgress) {
      toast.error('Only assigned provider can update subtask checklist');
      return;
    }
    setUpdatingSubtaskId(subtaskId);
    try {
      await updateTaskSubtaskStatus(id, subtaskId, status);
      toast.success('Subtask updated');
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to update subtask';
      toast.error(message);
    } finally {
      setUpdatingSubtaskId(null);
    }
  };

  const handleConfirmCompletion = async () => {
    if (!id || !canConfirmCompletion) {
      toast.error('Only requester can confirm completion');
      return;
    }

    setIsConfirming(true);
    try {
      await confirmTaskCompletion(id);
      toast.success('Task marked completed. You can proceed to payment.');
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to confirm completion';
      toast.error(message);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDepositEscrow = async () => {
    if (!id || !canDepositEscrow) {
      toast.error('Escrow deposit is not available for this task');
      return;
    }
    setIsDepositingEscrow(true);
    try {
      const response = await api.payment.create({
        taskId: Number(id),
        method: 'STRIPE',
        flow: 'ESCROW_DEPOSIT',
      });
      const paymentUrl = response.data?.paymentUrl;
      if (!paymentUrl) throw new Error('No payment URL returned');
      window.location.href = paymentUrl;
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to start escrow deposit';
      toast.error(message);
      setIsDepositingEscrow(false);
    }
  };

  const handleSubmitDispute = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id || !canOpenDispute) {
      toast.error('Dispute is not available for this task');
      return;
    }
    if (!disputeDescription.trim()) {
      toast.error('Please describe the dispute');
      return;
    }

    setIsSubmittingDispute(true);
    try {
      const evidenceUrls = disputeEvidenceFiles.length
        ? await Promise.all(disputeEvidenceFiles.map((file) => uploadImageToCloudinary(file)))
        : [];
      await openTaskDispute(id, {
        reason: disputeReason,
        description: disputeDescription.trim(),
        evidenceUrls,
      });
      toast.success('Dispute opened. Task flow and escrow are now frozen for review.');
      setDisputeDescription('');
      setDisputeEvidenceFiles([]);
      setDisputeReason('QUALITY_ISSUE');
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to open dispute';
      toast.error(message);
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  const handleCancelTask = async () => {
    if (!id || !canRequestCancel) {
      toast.error('Cancel action is not available');
      return;
    }
    const reason = cancelReason.trim();
    if (reason.length < 3) {
      toast.error('Please provide a short reason');
      return;
    }
    setIsCancellingTask(true);
    try {
      await cancelTaskByRequester(id, reason);
      toast.success('Task cancelled');
      setShowCancelModal(false);
      setCancelReason('');
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to cancel task';
      toast.error(message);
    } finally {
      setIsCancellingTask(false);
    }
  };

  if (isLoading && !currentTask) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md text-center py-10">Loading task progress...</Card>
      </div>
    );
  }

  if (!currentTask || !canViewProgress) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center">
            <ExclamationTriangleIcon className="w-10 h-10 mx-auto text-amber-500 mb-3" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Access restricted</h2>
            <p className="text-slate-600 mb-6">
              Only the requester and assigned provider can view this task progress page.
            </p>
            <Button onClick={() => navigate('/browse-tasks')}>Back to tasks</Button>
          </Card>
        </div>
      </div>
    );
  }

  const requester = currentTask.createdBy || currentTask.client;
  const provider = currentTask.assignedProvider;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(`/tasks/${currentTask.id}`)} className="mb-4">
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Task Detail
          </Button>

          <div className="rounded-3xl border border-slate-200 bg-white/90 backdrop-blur p-6 shadow-lg">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Task Progress Tracking</p>
                <h1 className="text-3xl font-bold text-slate-900 mt-1">{currentTask.title}</h1>
                <p className="text-slate-600 mt-2 max-w-3xl">{currentTask.description}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {isOverdue && (
                  <span className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold bg-red-50 text-red-700 border-red-200">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    Overdue
                  </span>
                )}
                {hasOpenDispute && (
                  <span className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold bg-rose-50 text-rose-700 border-rose-200">
                    <ShieldExclamationIcon className="w-4 h-4" />
                    Disputed
                  </span>
                )}
                <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${statusMeta.chip}`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${statusMeta.dot}`} />
                  {statusMeta.label}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Progress</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{summaryProgress}%</p>
                <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500"
                    style={{ width: `${summaryProgress}%` }}
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Latest Milestone</p>
                <p className="text-base font-semibold text-slate-900 mt-2">
                  {taskProgressSummary?.milestoneStatus || 'No milestone update yet'}
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  {doneSubtasks}/{totalSubtasks} subtasks completed
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Estimated Completion</p>
                <p className="text-base font-semibold text-slate-900 mt-2">
                  {taskProgressSummary?.estimatedCompletionDate
                    ? formatDate(taskProgressSummary.estimatedCompletionDate)
                    : 'Not set yet'}
                </p>
                <p className="text-sm text-slate-500 mt-2">Attachments: {taskProgressSummary?.attachmentsCount || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 space-y-6">
            <Card className="p-6 border-0 shadow-lg">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-slate-900">Progress Timeline</h2>
                <span className="text-sm text-slate-500">Newest first</span>
              </div>

              {taskProgressUpdates.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center">
                  <p className="text-slate-600">No progress updates yet.</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Assigned provider updates will appear here with timestamps and proof.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {taskProgressUpdates.map((update, index) => (
                    <div key={update.id} className="relative pl-8">
                      {index < taskProgressUpdates.length - 1 && (
                        <span className="absolute left-3 top-7 bottom-[-24px] w-px bg-slate-200" />
                      )}
                      <span className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center text-xs font-semibold">
                        {Math.round(update.progressPercent / 10)}
                      </span>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {update.provider?.name || 'Assigned provider'} updated progress to {update.progressPercent}%
                            </p>
                            <p className="text-xs text-slate-500 mt-1">{formatRelativeTime(update.createdAt)}</p>
                          </div>
                          <span className="text-xs font-semibold rounded-full px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {update.progressPercent}%
                          </span>
                        </div>

                        <p className="text-slate-700 mt-3 whitespace-pre-line">{update.note}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-sm">
                          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                            <p className="text-slate-500">Milestone</p>
                            <p className="font-medium text-slate-900 mt-1">
                              {update.milestoneStatus || 'No milestone set'}
                            </p>
                          </div>
                          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                            <p className="text-slate-500">Estimated completion</p>
                            <p className="font-medium text-slate-900 mt-1">
                              {update.estimatedCompletionDate
                                ? formatDate(update.estimatedCompletionDate)
                                : 'Not specified'}
                            </p>
                          </div>
                        </div>

                        {update.attachments && update.attachments.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-semibold text-slate-800 mb-2">Proof of work</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {update.attachments.map((url, fileIndex) => (
                                <a
                                  key={`${update.id}-${fileIndex}`}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="group block rounded-xl overflow-hidden border border-slate-200 bg-slate-50 hover:border-blue-300"
                                >
                                  <img
                                    src={url}
                                    alt={`Proof ${fileIndex + 1}`}
                                    className="h-24 w-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {allAttachments.length > 0 && (
              <Card className="p-6 border-0 shadow-lg">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Attachment Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {allAttachments.map((item) => (
                    <a
                      key={item.key}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 hover:border-blue-300"
                    >
                      <img src={item.url} alt="Task proof" className="h-28 w-full object-cover" />
                      <p className="px-2 py-1.5 text-[11px] text-slate-500">{formatDate(item.createdAt)}</p>
                    </a>
                  ))}
                </div>
              </Card>
            )}

            <Card className="p-6 border-0 shadow-lg">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Activity Log</h2>
              {taskActivityLogs.length === 0 ? (
                <p className="text-sm text-slate-500">No activity logs yet.</p>
              ) : (
                <div className="space-y-3">
                  {taskActivityLogs.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-900">
                          {item.actor?.name || 'System'} · {item.action}
                        </p>
                        <span className="text-xs text-slate-500">{formatRelativeTime(item.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-700 mt-1.5">{item.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-6 border-0 shadow-lg">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Dispute History</h2>
              {taskDisputes.length === 0 ? (
                <p className="text-sm text-slate-500">No disputes opened for this task.</p>
              ) : (
                <div className="space-y-3">
                  {taskDisputes.map((dispute) => (
                    <div key={dispute.id} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">{dispute.reason.replaceAll('_', ' ')}</p>
                        <span className="text-xs font-semibold rounded-full px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200">
                          {dispute.status}
                        </span>
                      </div>
                      {dispute.description && <p className="text-sm text-slate-700 mt-2">{dispute.description}</p>}
                      <p className="text-xs text-slate-500 mt-2">
                        Opened by {dispute.openedBy?.name || 'Participant'} · {formatDate(dispute.createdAt)}
                      </p>
                      {dispute.evidenceUrls && dispute.evidenceUrls.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          {dispute.evidenceUrls.map((url, index) => (
                            <a
                              key={`${dispute.id}-${index}`}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg overflow-hidden border border-slate-200"
                            >
                              <img src={url} alt={`Dispute evidence ${index + 1}`} className="h-20 w-full object-cover" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="xl:col-span-4 space-y-6">
            <Card className="p-6 border-0 shadow-lg">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Task Team</h2>
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Requester</p>
                  <p className="text-base font-semibold text-slate-900 mt-1">{requester?.name || 'Unknown'}</p>
                  {requester?.phone && (
                    <p className="text-sm text-slate-600 mt-1 flex items-center gap-2">
                      <PhoneIcon className="w-4 h-4" />
                      {requester.phone}
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Assigned Provider</p>
                  <p className="text-base font-semibold text-slate-900 mt-1">{provider?.name || 'Not assigned'}</p>
                  {provider?.phone && (
                    <p className="text-sm text-slate-600 mt-1 flex items-center gap-2">
                      <PhoneIcon className="w-4 h-4" />
                      {provider.phone}
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">On-Site Verification</p>
                  <p className="text-base font-semibold text-slate-900 mt-1">
                    {currentTask?.isOnSite ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckBadgeIcon className="w-5 h-5" />
                        Verified Complete
                      </span>
                    ) : (
                      <span className="text-amber-600 flex items-center gap-1">
                        <ExclamationTriangleIcon className="w-5 h-5" />
                        Pending GPS Verification
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Providers must verify physical presence via mobile app
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-0 shadow-lg">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Subtask Checklist</h2>
              {taskSubtasks.length === 0 ? (
                <p className="text-sm text-slate-500">No subtasks available for this task yet.</p>
              ) : (
                <div className="space-y-2">
                  {taskSubtasks.map((subtask) => (
                    <div key={subtask.id} className="rounded-lg bg-slate-50 border border-slate-200 p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircleIcon className={`w-4 h-4 ${subtask.status === 'DONE' ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span className="text-sm font-medium text-slate-700">
                            {subtask.progressPercent || subtask.order * 25}% · {subtask.title}
                          </span>
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white border border-slate-200 text-slate-700">
                          {subtask.status.replace('_', ' ')}
                        </span>
                      </div>
                      {canManageProgress && currentTask?.isOnSite && (
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updatingSubtaskId === subtask.id}
                            onClick={() => handleUpdateSubtaskStatus(subtask.id, 'PENDING')}
                          >
                            Pending
                          </Button>
                          <Button
                            size="sm"
                            disabled={updatingSubtaskId === subtask.id}
                            onClick={() => handleUpdateSubtaskStatus(subtask.id, 'DONE')}
                          >
                            Done
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-6 border-0 shadow-lg">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Payment & Escrow</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Escrow status</span>
                  <span className="font-semibold text-slate-900">{taskPaymentSummary?.escrowStatus || currentTask.escrowStatus || 'NONE'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment status</span>
                  <span className="font-semibold text-slate-900">{taskPaymentSummary?.paymentStatus || currentTask.paymentStatus || 'UNPAID'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Escrow amount</span>
                  <span className="font-semibold text-slate-900">
                    {Number(taskPaymentSummary?.escrowAmount || currentTask.escrowAmount || currentTask.budget || 0).toLocaleString()} đ
                  </span>
                </div>
              </div>

              {canDepositEscrow && (
                <Button className="w-full mt-4" onClick={handleDepositEscrow} disabled={isDepositingEscrow}>
                  <BanknotesIcon className="w-5 h-5 mr-2" />
                  {isDepositingEscrow ? 'Redirecting...' : 'Deposit Escrow'}
                </Button>
              )}

              <div className="mt-4 border-t border-slate-200 pt-4">
                <p className="text-sm font-semibold text-slate-800 mb-2">Transaction Logs</p>
                {taskPaymentTransactions.length === 0 ? (
                  <p className="text-xs text-slate-500">No transactions yet.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-auto pr-1">
                    {taskPaymentTransactions.map((tx) => (
                      <div key={tx.id} className="rounded-lg border border-slate-200 p-2.5 bg-slate-50">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-800">{tx.type.replaceAll('_', ' ')}</p>
                          <span className="text-[11px] text-slate-500">{tx.status}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          {Number(tx.amount || 0).toLocaleString()} đ · {formatDate(tx.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {canManageProgress && !currentTask.isOnSite && (
              <Card className="p-6 border-0 shadow-lg">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <ShieldExclamationIcon className="w-6 h-6 text-amber-500" />
                  Location Verification Required
                </h2>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <p className="font-semibold mb-1">On-Site Verification Needed</p>
                  <p>
                    To ensure security and transparency, you must verify your location via the ConnectMyTask mobile app before you can update progress or complete subtasks. Please open the mobile app and tap "Verify GPS Location" at the task address.
                  </p>
                </div>
              </Card>
            )}

            {canManageProgress && currentTask.isOnSite && (
              <Card className="p-6 border-0 shadow-lg">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Provider Update Panel</h2>
                <form onSubmit={handleSubmitProgress} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Progress (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={progressPercent}
                      onChange={(e) => setProgressPercent(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0 - 100"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">Work summary note</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={4}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Describe what has been completed and what comes next"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">Milestone status</label>
                    <input
                      type="text"
                      value={milestoneStatus}
                      onChange={(e) => setMilestoneStatus(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Example: Wiring completed"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">Estimated completion date</label>
                    <div className="relative mt-1">
                      <CalendarDaysIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="date"
                        value={estimatedCompletionDate}
                        onChange={(e) => setEstimatedCompletionDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">Upload proof (images)</label>
                    <label className="mt-1 flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2.5 bg-slate-50 cursor-pointer hover:border-blue-300">
                      <CloudArrowUpIcon className="w-5 h-5 text-slate-500" />
                      <span className="text-sm text-slate-600">Choose file(s)</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => setProofFiles(Array.from(e.target.files || []))}
                      />
                    </label>
                    {proofFiles.length > 0 && (
                      <p className="text-xs text-slate-500 mt-1">{proofFiles.length} file(s) selected</p>
                    )}
                  </div>

                  <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700">
                    <label className="inline-flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={markAsCompleted}
                        onChange={(e) => setMarkAsCompleted(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>
                        Mark task as completed (requires progress 100%). Status will move to
                        <span className="font-semibold"> Pending Confirmation</span>.
                      </span>
                    </label>
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Publishing update...' : 'Publish Progress Update'}
                  </Button>
                </form>
              </Card>
            )}

            {canOpenDispute && (
              <Card className="p-6 border-0 shadow-lg">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Open Dispute</h2>
                {hasOpenDispute ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                    An active dispute is already open for this task. Task status and escrow are frozen until resolution.
                  </div>
                ) : (
                  <form className="space-y-3" onSubmit={handleSubmitDispute}>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Reason</label>
                      <select
                        value={disputeReason}
                        onChange={(event) => setDisputeReason(event.target.value as typeof disputeReason)}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="QUALITY_ISSUE">Quality issue</option>
                        <option value="PROVIDER_NOT_DELIVERING">Provider not delivering</option>
                        <option value="REQUESTER_NOT_CONFIRMING">Requester not confirming</option>
                        <option value="PAYMENT_ISSUE">Payment issue</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Description</label>
                      <textarea
                        value={disputeDescription}
                        onChange={(event) => setDisputeDescription(event.target.value)}
                        rows={3}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="Describe the issue and expected resolution"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Evidence (optional)</label>
                      <label className="mt-1 flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2.5 bg-slate-50 cursor-pointer hover:border-blue-300">
                        <CloudArrowUpIcon className="w-5 h-5 text-slate-500" />
                        <span className="text-sm text-slate-600">Upload evidence image(s)</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(event) => setDisputeEvidenceFiles(Array.from(event.target.files || []))}
                        />
                      </label>
                      {disputeEvidenceFiles.length > 0 && (
                        <p className="text-xs text-slate-500 mt-1">{disputeEvidenceFiles.length} file(s) selected</p>
                      )}
                    </div>
                    <Button type="submit" variant="outline" className="w-full border-rose-300 text-rose-700 hover:bg-rose-50" disabled={isSubmittingDispute}>
                      {isSubmittingDispute ? 'Opening dispute...' : 'Open Dispute'}
                    </Button>
                  </form>
                )}
              </Card>
            )}

            {canConfirmCompletion && (
              <Card className="p-6 border-0 shadow-lg">
                <h2 className="text-lg font-bold text-slate-900 mb-3">Requester Confirmation</h2>
                <p className="text-sm text-slate-600 mb-4">
                  Provider has marked this task as completed. Confirm when work quality is accepted.
                </p>
                <Button className="w-full" onClick={() => setShowCompletionModal(true)} disabled={isConfirming}>
                  <CheckBadgeIcon className="w-5 h-5 mr-2" />
                  {isConfirming ? 'Confirming...' : 'Confirm Completion'}
                </Button>
              </Card>
            )}

            {canRequestCancel && (
              <Card className="p-6 border-0 shadow-lg">
                <h2 className="text-lg font-bold text-slate-900 mb-3">Cancel Task</h2>
                <p className="text-sm text-slate-600 mb-4">
                  You can cancel before work starts. If work has started, open dispute for review.
                </p>
                <Button variant="outline" className="w-full border-red-300 text-red-700 hover:bg-red-50" onClick={() => setShowCancelModal(true)}>
                  Request Cancellation
                </Button>
              </Card>
            )}

            <Card className="p-6 border-0 shadow-lg">
              <h2 className="text-lg font-bold text-slate-900 mb-3">Contact</h2>
              <p className="text-sm text-slate-600 mb-3">
                Need to discuss requirements? Open task detail to continue provider-requester contact flow.
              </p>
              <Button variant="outline" className="w-full" onClick={() => navigate(`/tasks/${currentTask.id}`)}>
                <DocumentDuplicateIcon className="w-5 h-5 mr-2" />
                Open Task Conversation
              </Button>
              <div className="mt-4 text-sm text-slate-600 flex items-center gap-2">
                <UserCircleIcon className="w-5 h-5 text-slate-400" />
                {isRequester ? `Provider: ${provider?.name || 'Unavailable'}` : `Requester: ${requester?.name || 'Unavailable'}`}
              </div>
            </Card>
          </div>
        </div>
      </div>
      <Modal
        isOpen={showCompletionModal}
        onClose={() => {
          if (isConfirming) return;
          setShowCompletionModal(false);
        }}
        title="Confirm Completion"
        footer={(
          <>
            <Button variant="outline" onClick={() => setShowCompletionModal(false)} disabled={isConfirming}>
              Review Again
            </Button>
            <Button
              onClick={async () => {
                await handleConfirmCompletion();
                setShowCompletionModal(false);
              }}
              disabled={isConfirming}
            >
              {isConfirming ? 'Confirming...' : 'Confirm & Release Escrow'}
            </Button>
          </>
        )}
      >
        <p className="text-sm text-slate-600">
          Confirming completion will release escrow payment to the assigned provider and lock this task as paid.
        </p>
      </Modal>

      <Modal
        isOpen={showCancelModal}
        onClose={() => {
          if (isCancellingTask) return;
          setShowCancelModal(false);
        }}
        title="Cancel Task"
        footer={(
          <>
            <Button variant="outline" onClick={() => setShowCancelModal(false)} disabled={isCancellingTask}>
              Keep Task
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 border-red-600"
              onClick={handleCancelTask}
              disabled={isCancellingTask}
            >
              {isCancellingTask ? 'Cancelling...' : 'Confirm Cancel'}
            </Button>
          </>
        )}
      >
        <p className="text-sm text-slate-600 mb-3">
          Add a short reason. This action will be recorded in the task activity log.
        </p>
        <textarea
          value={cancelReason}
          onChange={(event) => setCancelReason(event.target.value)}
          rows={4}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Example: Task no longer needed"
        />
      </Modal>
    </div>
  );
};
