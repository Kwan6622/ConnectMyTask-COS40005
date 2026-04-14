import React, { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  BanknotesIcon,
  ChartBarIcon,
  ClockIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useAuthStore } from '../stores/auth.store';
import { useTaskStore } from '../stores/task.store';
import { formatVnd } from '../utils';

const badgeStyles: Record<string, string> = {
  OPEN: 'bg-blue-50 text-blue-700 border-blue-200',
  BIDDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  ASSIGNED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  IN_PROGRESS: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  PENDING_CONFIRMATION: 'bg-amber-50 text-amber-700 border-amber-200',
  COMPLETED: 'bg-slate-100 text-slate-700 border-slate-300',
  AWAITING_PAYMENT: 'bg-orange-50 text-orange-700 border-orange-200',
  PAID: 'bg-teal-50 text-teal-700 border-teal-200',
  DISPUTED: 'bg-red-50 text-red-700 border-red-200',
};

function statusLabel(status: string) {
  return status.split('_').join(' ');
}

export const RequesterDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { requesterTasks, fetchRequesterTasks, isLoading } = useTaskStore();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (String(user.role).toUpperCase() !== 'REQUESTER' && String(user.role).toUpperCase() !== 'CLIENT') {
      navigate('/browse-tasks');
      return;
    }
    fetchRequesterTasks();
  }, [fetchRequesterTasks, navigate, user]);

  const metrics = useMemo(() => {
    const assigned = requesterTasks.filter((task) => task.assignedProviderId != null).length;
    const inProgress = requesterTasks.filter((task) => ['IN_PROGRESS', 'PENDING_CONFIRMATION'].includes(task.status)).length;
    const totalBids = requesterTasks.reduce((sum, task) => sum + (task._count?.bids ?? task.bids?.length ?? 0), 0);
    const totalBudget = requesterTasks.reduce((sum, task) => sum + Number(task.budget || 0), 0);

    return {
      posted: requesterTasks.length,
      assigned,
      inProgress,
      totalBids,
      totalBudget,
    };
  }, [requesterTasks]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="rounded-3xl bg-white border border-slate-200 shadow-lg p-6 mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide font-semibold text-blue-600">Requester Workspace</p>
              <h1 className="text-3xl font-bold text-slate-900 mt-1">Task Progress Dashboard</h1>
              <p className="text-slate-600 mt-2">
                Track assigned work, review bids, and monitor provider progress updates transparently.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => fetchRequesterTasks()}>
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => navigate('/post-task')}>Post Task</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">My Posted Tasks</p>
                <ChartBarIcon className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">{metrics.posted}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">Assigned Tasks</p>
                <UserGroupIcon className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">{metrics.assigned}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">Task Progress</p>
                <ClockIcon className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">{metrics.inProgress}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">Budget Pipeline</p>
                <BanknotesIcon className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">{formatVnd(metrics.totalBudget)}</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <Card className="text-center py-12">Loading your tasks...</Card>
        ) : requesterTasks.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-slate-700 mb-4">No posted tasks yet.</p>
            <Button onClick={() => navigate('/post-task')}>Create first task</Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {requesterTasks.map((task) => {
              const bidCount = task._count?.bids ?? task.bids?.length ?? 0;
              const canOpenProgress = Boolean(task.assignedProviderId || ['IN_PROGRESS', 'PENDING_CONFIRMATION', 'COMPLETED', 'AWAITING_PAYMENT', 'PAID'].includes(task.status));
              const style = badgeStyles[task.status] || 'bg-slate-100 text-slate-700 border-slate-300';

              return (
                <Card key={task.id} className="p-5 border-0 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-[280px]">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link to={`/tasks/${task.id}`} className="text-lg font-semibold text-slate-900 hover:text-blue-600">
                          {task.title}
                        </Link>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${style}`}>
                          {statusLabel(task.status)}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-2 line-clamp-2">{task.description}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 text-sm">
                        <p className="text-slate-600">Bids: <span className="font-semibold text-slate-900">{bidCount}</span></p>
                        <p className="text-slate-600">Budget: <span className="font-semibold text-slate-900">{task.budget != null ? formatVnd(task.budget) : 'Flexible'}</span></p>
                        <p className="text-slate-600">Assigned: <span className="font-semibold text-slate-900">{task.assignedProvider?.name || 'Not assigned'}</span></p>
                        <p className="text-slate-600">Created: <span className="font-semibold text-slate-900">{new Date(task.createdAt).toLocaleDateString()}</span></p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={() => navigate(`/tasks/${task.id}`)}>
                        View Task
                      </Button>
                      {canOpenProgress && (
                        <Button onClick={() => navigate(`/tasks/${task.id}/progress`)}>
                          Track Progress
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
