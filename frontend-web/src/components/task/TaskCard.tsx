import React from 'react';
import { Link } from 'react-router-dom';
import type { Task } from '../../types';
import { TaskStatus, TaskCategory } from '../../types';
import { Button } from '../common/Button';
import {
  TruckIcon,
  WrenchIcon,
  SparklesIcon,
  ComputerDesktopIcon,
  UserCircleIcon,
  AcademicCapIcon,
  QuestionMarkCircleIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const categoryIcons: Record<TaskCategory, React.ReactNode> = {
  [TaskCategory.DELIVERY]: <TruckIcon className="w-5 h-5" />,
  [TaskCategory.HOME_REPAIR]: <WrenchIcon className="w-5 h-5" />,
  [TaskCategory.CLEANING]: <SparklesIcon className="w-5 h-5" />,
  [TaskCategory.IT_SUPPORT]: <ComputerDesktopIcon className="w-5 h-5" />,
  [TaskCategory.PERSONAL_ASSISTANT]: <UserCircleIcon className="w-5 h-5" />,
  [TaskCategory.MOVING]: <TruckIcon className="w-5 h-5" />,
  [TaskCategory.TUTORING]: <AcademicCapIcon className="w-5 h-5" />,
  [TaskCategory.OTHER]: <QuestionMarkCircleIcon className="w-5 h-5" />,
};

const statusColors: Record<TaskStatus, { bg: string; text: string; border: string }> = {
  [TaskStatus.POSTED]: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  [TaskStatus.BIDDING]: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  [TaskStatus.ASSIGNED]: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  [TaskStatus.IN_PROGRESS]: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  [TaskStatus.COMPLETED]: { bg: 'bg-dark-50', text: 'text-dark-700', border: 'border-dark-200' },
  [TaskStatus.CANCELLED]: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

interface TaskCardProps {
  task: Task;
  showActions?: boolean;
  onClick?: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, showActions = true, onClick }) => {
  const statusStyle = statusColors[task.status] || statusColors[TaskStatus.POSTED];
  const displayPrice = task.aiSuggestedPrice ?? task.budget;

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      className="card-hover overflow-hidden group cursor-pointer"
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-xl ${task.status === TaskStatus.POSTED ? 'bg-primary-50' : 'bg-dark-50'}`}>
              <div className="text-dark-600">
                {categoryIcons[task.category]}
              </div>
            </div>
            <div>
              <Link to={`/tasks/${task.id}`}>
                <h3 className="text-lg font-semibold text-dark-900 group-hover:text-primary-600 transition-colors">
                  {task.title}
                </h3>
              </Link>
              <div className="flex items-center space-x-3 mt-1">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                  {task.status.replace('_', ' ')}
                </span>
                <span className="text-sm text-dark-500">
                  {format(new Date(task.createdAt), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="text-2xl font-bold text-success-600">
              {displayPrice ? `${displayPrice.toLocaleString()} đ` : 'N/A'}
            </p>
            {task.aiSuggestedPrice && (
              <p className="text-xs text-dark-500">AI Suggested</p>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-dark-600 mb-4 line-clamp-2 text-sm">
          {task.description}
        </p>

        {task.imageUrls && task.imageUrls.length > 0 && (
          <div className="mb-4">
            <img
              src={task.imageUrls[0]}
              alt={task.title}
              className="w-full h-40 rounded-xl object-cover border"
            />
          </div>
        )}

        {/* Details */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center text-dark-600 text-sm">
            <MapPinIcon className="w-4 h-4 mr-2 text-dark-400" />
            <span className="truncate">{task.location}</span>
          </div>

          {task.deadline && (
            <div className="flex items-center text-dark-600 text-sm">
              <ClockIcon className="w-4 h-4 mr-2 text-dark-400" />
              <span>Due {format(new Date(task.deadline), 'MMM d')}</span>
            </div>
          )}

          <div className="flex items-center text-dark-600 text-sm">
            <CurrencyDollarIcon className="w-4 h-4 mr-2 text-dark-400" />
            <span>Budget: {task.budget ? `${task.budget.toLocaleString()} đ` : 'Flexible'}</span>
          </div>

          <div className="flex items-center text-dark-600 text-sm">
            <UserCircleIcon className="w-4 h-4 mr-2 text-dark-400" />
            <span className="truncate">{task.client?.fullName || 'Anonymous'}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-dark-50/50 border-t border-dark-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {task.matchingScore && (
              <div className="flex items-center">
                <div className="w-20 bg-dark-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-success-400 to-success-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${task.matchingScore}%` }}
                  />
                </div>
                <span className="ml-2 text-sm text-dark-600 font-medium">
                  {task.matchingScore}% match
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex space-x-2">
              <Link to={`/tasks/${task.id}`}>
                <Button variant="outline" size="sm">
                  View
                </Button>
              </Link>
              {(task.status === TaskStatus.POSTED || task.status === TaskStatus.BIDDING) && (
                <Link to={`/tasks/${task.id}/bid`}>
                  <Button size="sm">
                    Bid
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
