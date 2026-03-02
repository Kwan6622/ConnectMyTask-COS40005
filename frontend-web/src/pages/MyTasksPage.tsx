import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { useTaskStore } from '../stores/task.store';
import { TaskCard } from '../components/task/TaskCard';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export const MyTasksPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { tasks, isLoading, fetchTasks, deleteTask } = useTaskStore();
  const [filter, setFilter] = useState<'all' | 'posted' | 'bidded'>('all');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchTasks();
  }, [user, navigate]);

  const handleDelete = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId);
        toast.success('Task deleted successfully');
      } catch (error) {
        toast.error('Failed to delete task');
      }
    }
  };

  const handleEdit = (taskId: string) => {
    navigate(`/post-task?id=${taskId}`);
  };

  const myTasks = tasks.filter(task => task.client?.id === user?.id);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; border: string }> = {
      POSTED: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
      BIDDING: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
      ASSIGNED: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
      IN_PROGRESS: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
      COMPLETED: { bg: 'bg-dark-50', text: 'text-dark-700', border: 'border-dark-200' },
    };
    return styles[status] || styles.POSTED;
  };

  return (
    <div className="min-h-screen bg-dark-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-dark-900">My Tasks</h1>
            <p className="text-dark-600 mt-1">Manage your posted tasks and bids</p>
          </div>
          <Button
            onClick={() => navigate('/post-task')}
            className="flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Post New Task
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-8 flex-wrap">
          {(['all', 'posted', 'bidded'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                filter === f
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                  : 'bg-white text-dark-700 hover:bg-dark-50 border border-dark-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Tasks List */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
            <p className="text-dark-600 mt-4">Loading tasks...</p>
          </div>
        ) : myTasks.length === 0 ? (
          <Card className="text-center py-16">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-dark-900 mb-2">No tasks yet</h3>
            <p className="text-dark-600 mb-6">Start by posting your first task</p>
            <Button onClick={() => navigate('/post-task')}>
              Create Your First Task
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {myTasks.map((task) => {
              const statusStyle = getStatusBadge(task.status);
              return (
                <div
                  key={task.id}
                  className="card-hover p-6"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-dark-900 truncate">{task.title}</h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-dark-600 mt-1 line-clamp-2">{task.description}</p>
                      <div className="flex gap-6 mt-4 text-sm flex-wrap">
                        <span className="flex items-center gap-2 text-dark-600">
                          <span className="text-lg">💰</span>
                          <span className="font-semibold text-dark-900">${task.budget || 'Flexible'}</span>
                        </span>
                        <span className="flex items-center gap-2 text-dark-600">
                          <span className="text-lg">📅</span>
                          <span>{new Date(task.deadline || task.createdAt).toLocaleDateString()}</span>
                        </span>
                        <span className="flex items-center gap-2 text-dark-600">
                          <span className="text-lg">🏷️</span>
                          <span>{task.category.replace('_', ' ')}</span>
                        </span>
                        {task.matchingScore && (
                          <span className="flex items-center gap-2 text-dark-600">
                            <span className="text-lg">✨</span>
                            <span className="font-medium text-success-600">{task.matchingScore}% match</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(task.id)}
                        className="p-3 text-primary-500 hover:bg-primary-50 rounded-xl transition-all"
                        title="Edit task"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="p-3 text-danger-500 hover:bg-danger-50 rounded-xl transition-all"
                        title="Delete task"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

