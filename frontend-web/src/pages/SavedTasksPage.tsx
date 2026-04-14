import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTaskStore } from '../stores/task.store';
import { useAuthStore } from '../stores/auth.store';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { formatVnd } from '../utils';

export const SavedTasksPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { savedTasks, fetchSavedTasks, unsaveTask } = useTaskStore();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchSavedTasks();
  }, [user, navigate, fetchSavedTasks]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-dark-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-3xl font-bold text-dark-900 mb-2">Saved Tasks</h1>
        <p className="text-dark-600 mb-8">Tasks you saved for later are stored in the database.</p>

        {savedTasks.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-dark-700 mb-4">No saved tasks yet.</p>
            <Button onClick={() => navigate('/browse-tasks')}>Browse Tasks</Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {savedTasks.map((saved) => (
              <Card key={saved.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link to={`/tasks/${saved.task.id}`} className="text-lg font-semibold text-dark-900 hover:text-primary-600">
                      {saved.task.title}
                    </Link>
                    <p className="text-dark-600 mt-1">{saved.task.description}</p>
                    <p className="text-sm text-dark-500 mt-2">
                      Posted by {saved.task.createdBy?.name || saved.task.client?.fullName || 'Anonymous'}
                    </p>
                    <p className="text-sm text-dark-500 mt-1">
                      Budget: {saved.task.budget != null ? formatVnd(saved.task.budget) : 'Flexible'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => unsaveTask(String(saved.task.id))}
                  >
                    Remove
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
