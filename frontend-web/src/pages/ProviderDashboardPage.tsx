import React, { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  BellIcon,
  BookmarkIcon,
  BriefcaseIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useAuthStore } from '../stores/auth.store';
import { useTaskStore } from '../stores/task.store';
import { formatVnd } from '../utils';

const badgeStyles: Record<string, string> = {
  ASSIGNED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  IN_PROGRESS: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  PENDING_CONFIRMATION: 'bg-amber-50 text-amber-700 border-amber-200',
  COMPLETED: 'bg-slate-100 text-slate-700 border-slate-300',
  AWAITING_PAYMENT: 'bg-orange-50 text-orange-700 border-orange-200',
  DISPUTED: 'bg-red-50 text-red-700 border-red-200',
  PAID: 'bg-teal-50 text-teal-700 border-teal-200',
};

function statusLabel(status: string) {
  return status.split('_').join(' ');
}

export const ProviderDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    assignedTasks,
    myBids,
    savedTasks,
    fetchAssignedTasks,
    fetchMyBids,
    fetchSavedTasks,
    isLoading,
  } = useTaskStore();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (String(user.role).toUpperCase() !== 'PROVIDER') {
      navigate('/browse-tasks');
      return;
    }
    fetchAssignedTasks();
    fetchMyBids();
    fetchSavedTasks();
  }, [fetchAssignedTasks, fetchMyBids, fetchSavedTasks, navigate, user]);

  const stats = useMemo(() => {
    const activeTasks = assignedTasks.filter((task) => ['ASSIGNED', 'IN_PROGRESS', 'PENDING_CONFIRMATION'].includes(task.status)).length;
    const completedTasks = assignedTasks.filter((task) => ['COMPLETED', 'AWAITING_PAYMENT', 'PAID'].includes(task.status)).length;
    const totalBids = myBids.length;
    const potentialRevenue = assignedTasks.reduce((sum, task) => sum + Number(task.budget || 0), 0);

    return {
      activeTasks,
      completedTasks,
      totalBids,
      potentialRevenue,
    };
  }, [assignedTasks, myBids]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-lg p-6 mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide font-semibold text-indigo-600">Provider Workspace</p>
              <h1 className="text-3xl font-bold text-slate-900 mt-1">Execution Dashboard</h1>
              <p className="text-slate-600 mt-2">
                Manage assigned tasks, publish progress updates, and track your bidding performance.
              </p>
            </div>
            <Button variant="outline" onClick={() => {
              fetchAssignedTasks();
              fetchMyBids();
              fetchSavedTasks();
            }}>
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">My Active Tasks</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{stats.activeTasks}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">Completed Tasks</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{stats.completedTasks}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">My Bids</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{stats.totalBids}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">Assigned Value</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{formatVnd(stats.potentialRevenue)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-6 text-sm">
            <button
              onClick={() => navigate('/browse-tasks')}
              className="rounded-xl border border-slate-200 bg-white hover:border-indigo-300 px-4 py-3 text-left"
            >
              <p className="font-semibold text-slate-800">Available Tasks</p>
              <p className="text-slate-500 mt-1">Find tasks to bid on</p>
            </button>
            <button
              onClick={() => navigate('/provider-dashboard')}
              className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-left"
            >
              <p className="font-semibold text-indigo-700">My Active Tasks</p>
              <p className="text-indigo-600 mt-1">Update Progress</p>
            </button>
            <button
              onClick={() => navigate('/saved-tasks')}
              className="rounded-xl border border-slate-200 bg-white hover:border-indigo-300 px-4 py-3 text-left"
            >
              <p className="font-semibold text-slate-800">Saved Tasks</p>
              <p className="text-slate-500 mt-1">{savedTasks.length} items</p>
            </button>
            <button
              onClick={() => navigate('/provider-dashboard')}
              className="rounded-xl border border-slate-200 bg-white hover:border-indigo-300 px-4 py-3 text-left"
            >
              <p className="font-semibold text-slate-800">Notifications</p>
              <p className="text-slate-500 mt-1">Use bell icon in navbar</p>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="p-6 border-0 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">My Assigned Tasks</h2>
              <BriefcaseIcon className="w-5 h-5 text-slate-400" />
            </div>
            {isLoading ? (
              <p className="text-slate-600">Loading assigned tasks...</p>
            ) : assignedTasks.length === 0 ? (
              <p className="text-slate-600">No assigned tasks yet.</p>
            ) : (
              <div className="space-y-3">
                {assignedTasks.map((task) => {
                  const style = badgeStyles[task.status] || 'bg-slate-100 text-slate-700 border-slate-300';
                  const isFinishedTask = ['COMPLETED', 'PAID'].includes(String(task.status || '').toUpperCase());
                  return (
                    <div key={task.id} className="rounded-xl border border-slate-200 p-4 hover:border-indigo-200 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link to={`/tasks/${task.id}`} className="font-semibold text-slate-900 hover:text-indigo-600">
                            {task.title}
                          </Link>
                          <p className="text-sm text-slate-600 mt-1">
                            Requester: <span className="font-semibold text-slate-800">{task.createdBy?.name || 'Unknown'}</span>
                          </p>
                          <p className="text-sm text-slate-600">Budget: <span className="font-semibold text-slate-800">{task.budget != null ? formatVnd(task.budget) : 'Flexible'}</span></p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${style}`}>
                          {statusLabel(task.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/tasks/${task.id}`)}>
                          View Task
                        </Button>
                        {!isFinishedTask ? (
                          <Button size="sm" onClick={() => navigate(`/tasks/${task.id}/progress`)}>
                            Update Progress
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="p-6 border-0 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">My Bids</h2>
              <ClipboardDocumentListIcon className="w-5 h-5 text-slate-400" />
            </div>
            {myBids.length === 0 ? (
              <p className="text-slate-600">No bids submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {myBids.map((bid: any) => (
                  <div key={bid.id} className="rounded-xl border border-slate-200 p-4 hover:border-indigo-200 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link to={`/tasks/${bid.task?.id}`} className="font-semibold text-slate-900 hover:text-indigo-600">
                          {bid.task?.title || 'Task'}
                        </Link>
                        <p className="text-sm text-slate-600 mt-1 flex items-center gap-1">
                          <CurrencyDollarIcon className="w-4 h-4" />
                          Offered: <span className="font-semibold text-slate-800">{formatVnd(Number(bid.price || bid.amount || 0))}</span>
                        </p>
                        <p className="text-sm text-slate-600">Status: <span className="font-semibold text-slate-800">{bid.status}</span></p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/tasks/${bid.task?.id}`)}>
                        Open
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Card className="p-5 border-0 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Saved Tasks</h3>
                <p className="text-sm text-slate-600 mt-1">Keep promising jobs for later bidding.</p>
              </div>
              <BookmarkIcon className="w-6 h-6 text-slate-400" />
            </div>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/saved-tasks')}>
              Open Saved Tasks
            </Button>
          </Card>

          <Card className="p-5 border-0 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Notifications</h3>
                <p className="text-sm text-slate-600 mt-1">Assignment and progress events are delivered in-app.</p>
              </div>
              <BellIcon className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-xs text-slate-500 mt-4">Use the bell icon in navbar to read and open notifications.</p>
          </Card>
        </div>
      </div>
    </div>
  );
};
