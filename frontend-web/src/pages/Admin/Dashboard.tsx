import React, { useEffect } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      navigate('/');
    }
  }, [user, navigate]);

  const stats = [
    { label: 'Total Users', value: '1,234', icon: '👥' },
    { label: 'Active Tasks', value: '567', icon: '📋' },
    { label: 'Total Revenue', value: '$12,345', icon: '💰' },
    { label: 'Disputes', value: '23', icon: '⚠️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage platform, users, and transactions</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="text-center py-6">
              <div className="text-4xl mb-2">{stat.icon}</div>
              <p className="text-gray-600 text-sm">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
            </Card>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-8">
          <Button
            onClick={() => navigate('/admin/users')}
            variant="outline"
          >
            Users
          </Button>
          <Button
            onClick={() => navigate('/admin/tasks')}
            variant="outline"
          >
            Tasks
          </Button>
          <Button
            onClick={() => navigate('/admin/disputes')}
            variant="outline"
          >
            Disputes
          </Button>
          <Button
            onClick={() => navigate('/admin/reports')}
            variant="outline"
          >
            Reports
          </Button>
        </div>

        {/* Content Area */}
        <Card className="py-8">
          <div className="text-center text-gray-600">
            <p className="text-lg">Admin panel features coming soon</p>
            <p className="text-sm mt-2">User management, task moderation, dispute resolution, and analytics</p>
          </div>
        </Card>
      </div>
    </div>
  );
};
