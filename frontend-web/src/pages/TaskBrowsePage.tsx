import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaskStore } from '../stores/task.store';
import { TaskCard } from '../components/task/TaskCard';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card } from '../components/common/Card';
import { TaskCategory, TaskStatus } from '../types';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  MapPinIcon,
  ArrowPathIcon,
  ClockIcon,
  CurrencyDollarIcon,
  StarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

export const TaskBrowsePage: React.FC = () => {
  const navigate = useNavigate();
  const { tasks, filters, isLoading, fetchTasks, setFilters, clearFilters } = useTaskStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const locationOptions = [
    '',
    'District 1',
    'District 2',
    'District 3',
    'District 4',
    'District 5',
    'District 6',
    'District 7',
    'District 8',
    'District 9',
    'District 10',
    'District 11',
    'District 12',
    'Binh Thanh',
    'Phu Nhuan',
    'Go Vap',
    'Tan Binh',
    'Tan Phu',
    'Thu Duc',
  ];

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({
      search: searchQuery,
      location: locationQuery,
    });
  };

  const handleCategoryClick = (categoryValue: TaskCategory) => {
    setFilters({
      category: filters.category === categoryValue ? undefined : categoryValue,
    });
  };

  const handleStatusClick = (statusValue: TaskStatus) => {
    setFilters({
      status: filters.status === statusValue ? undefined : statusValue,
    });
  };

  const handleReset = () => {
    setSearchQuery('');
    setLocationQuery('');
    clearFilters();
  };

  const categories: Array<{ value: TaskCategory; label: string; icon: string; count: number }> = [
    { value: TaskCategory.DELIVERY, label: 'Delivery', icon: '🚚', count: 0 },
    { value: TaskCategory.HOME_REPAIR, label: 'Home Repair', icon: '🔧', count: 0 },
    { value: TaskCategory.CLEANING, label: 'Cleaning', icon: '✨', count: 0 },
    { value: TaskCategory.IT_SUPPORT, label: 'IT Support', icon: '💻', count: 0 },
    { value: TaskCategory.PERSONAL_ASSISTANT, label: 'Personal Assistant', icon: '👤', count: 0 },
    { value: TaskCategory.MOVING, label: 'Moving', icon: '📦', count: 0 },
    { value: TaskCategory.TUTORING, label: 'Tutoring', icon: '📚', count: 0 },
    { value: TaskCategory.OTHER, label: 'Other', icon: '⭐', count: 0 },
  ].map((category) => ({
    ...category,
    count: tasks.filter((task) => task.category === category.value).length,
  }));

  const statuses: Array<{ value: TaskStatus; label: string; color: string }> = [
    { value: TaskStatus.POSTED, label: 'Posted', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: TaskStatus.BIDDING, label: 'Bidding', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { value: TaskStatus.ASSIGNED, label: 'Assigned', color: 'bg-green-100 text-green-700 border-green-200' },
    { value: TaskStatus.IN_PROGRESS, label: 'In Progress', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { value: TaskStatus.COMPLETED, label: 'Completed', color: 'bg-dark-100 text-dark-700 border-dark-200' },
  ];

  const filteredTasks = tasks.filter((task) => {
    if (filters.category && task.category !== filters.category) {
      return false;
    }

    if (filters.status && task.status !== filters.status) {
      return false;
    }

    if (
      filters.search &&
      !task.title.toLowerCase().includes(filters.search.toLowerCase()) &&
      !task.description.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }

    if (filters.location && !task.location.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }

    const budgetValue = task.budget ?? task.aiSuggestedPrice;
    if (filters.minBudget != null) {
      if (budgetValue == null || budgetValue < filters.minBudget) {
        return false;
      }
    }
    if (filters.maxBudget != null) {
      if (budgetValue == null || budgetValue > filters.maxBudget) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    const budgetA = a.budget ?? a.aiSuggestedPrice ?? 0;
    const budgetB = b.budget ?? b.aiSuggestedPrice ?? 0;
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    const deadlineA = new Date(a.deadline || 0).getTime();
    const deadlineB = new Date(b.deadline || 0).getTime();

    switch (sortBy) {
      case 'priceLow':
        return budgetA - budgetB;
      case 'priceHigh':
        return budgetB - budgetA;
      case 'deadline':
        return deadlineA - deadlineB;
      case 'recent':
      default:
        return dateB - dateA;
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Professional Background Pattern */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, #e5e7eb 1px, transparent 1px),
              linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
        <div className="absolute top-20 right-10 w-72 h-72 bg-blue-200/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-indigo-200/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-6 border border-white/20">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              Find Your Perfect Task
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Browse Available
              <span className="block bg-gradient-to-r from-blue-200 to-indigo-200 bg-clip-text text-transparent">Tasks</span>
            </h1>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              Explore available tasks and connect with trusted task posters in your area
            </p>

            <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="What are you looking for?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white/95 backdrop-blur-lg shadow-2xl border-0 focus:ring-2 focus:ring-white/30 h-14 text-lg"
                    leftIcon={<MagnifyingGlassIcon className="w-6 h-6 text-gray-400" />}
                  />
                </div>
                <div className="flex-1">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <MapPinIcon className="w-6 h-6" />
                    </span>
                    <select
                      value={locationQuery}
                      onChange={(e) => setLocationQuery(e.target.value)}
                      className="w-full bg-white/95 backdrop-blur-lg shadow-2xl border-0 focus:ring-2 focus:ring-white/30 h-14 text-lg rounded-xl pl-12 pr-4 text-gray-700"
                    >
                      {locationOptions.map((option) => (
                        <option key={option || 'all'} value={option}>
                          {option || 'All locations'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50 shadow-2xl px-8 h-14 text-lg font-semibold border-0">
                  Search Tasks
                </Button>
              </div>
            </form>
            
            {/* Quick Stats */}
            <div className="flex items-center justify-center gap-8 mt-8 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <UserGroupIcon className="w-5 h-5" />
                <span>{tasks.length} Active Tasks</span>
              </div>
              <div className="flex items-center gap-2">
                <StarIcon className="w-5 h-5" />
                <span>Verified Posters</span>
              </div>
              <div className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5" />
                <span>Updated Real-time</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Tasks */}
      <div className="relative container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 shadow-lg border-0 bg-white/95 backdrop-blur-sm">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <FunnelIcon className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                </div>
                
                {/* Categories */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Categories</h3>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <button
                        key={category.value}
                        onClick={() => handleCategoryClick(category.value)}
                        className={`
                          w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-200 group
                          ${
                            filters.category === category.value
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        <div className={`text-xl group-hover:scale-110 transition-transform duration-200 ${
                          filters.category === category.value ? 'scale-110' : ''
                        }`}>
                          {category.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">{category.label}</p>
                          <p className="text-xs text-gray-500">{category.count} tasks</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Status */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Status</h3>
                  <div className="space-y-2">
                    {statuses.map((status) => (
                      <button
                        key={status.value}
                        onClick={() => handleStatusClick(status.value)}
                        className={`
                          w-full px-4 py-2.5 rounded-xl border-2 text-sm font-medium text-left transition-all duration-200
                          ${
                            filters.status === status.value
                              ? status.color.replace('100', '500').replace('700', '100')
                              : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Price Range */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <CurrencyDollarIcon className="w-4 h-4" />
                    Price Range
                  </h3>
                  <div className="space-y-3">
                    <Input
                      type="number"
                      placeholder="Min Budget"
                      value={filters.minBudget ?? ''}
                      onChange={(e) =>
                        setFilters({
                          minBudget: e.target.value === '' ? undefined : Number(e.target.value),
                        })
                      }
                      className="h-10 border-gray-200 focus:ring-2 focus:ring-blue-500"
                      leftIcon={<CurrencyDollarIcon className="w-4 h-4 text-gray-400" />}
                    />
                    <Input
                      type="number"
                      placeholder="Max Budget"
                      value={filters.maxBudget ?? ''}
                      onChange={(e) =>
                        setFilters({
                          maxBudget: e.target.value === '' ? undefined : Number(e.target.value),
                        })
                      }
                      className="h-10 border-gray-200 focus:ring-2 focus:ring-blue-500"
                      leftIcon={<CurrencyDollarIcon className="w-4 h-4 text-gray-400" />}
                    />
                  </div>
                </div>
                
                {/* Reset */}
                {(filters.category || filters.status || filters.search || filters.location) && (
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="w-full border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    <ArrowPathIcon className="w-4 h-4 mr-2" />
                    Reset Filters
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Tasks Content */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {filteredTasks.length} {filteredTasks.length === 1 ? 'Task' : 'Tasks'} Found
                </h2>
                <p className="text-gray-600 mt-1">
                  {filters.category || filters.status || filters.search || filters.location || filters.minBudget != null || filters.maxBudget != null
                    ? 'Matching your filters'
                    : 'Showing all available tasks'}
                </p>
              </div>
              
              {/* Sort Options */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="recent">Most Recent</option>
                  <option value="priceLow">Price: Low to High</option>
                  <option value="priceHigh">Price: High to Low</option>
                  <option value="deadline">Deadline</option>
                </select>
              </div>
            </div>
            
            {/* Tasks Grid */}
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Loading amazing tasks...</p>
                </div>
              </div>
            ) : filteredTasks.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => navigate(`/tasks/${task.id}`)}
                    />
                  ))}
                </div>
                
                {/* Pagination */}
                <div className="flex justify-center mt-12">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="border-gray-200 text-gray-600 hover:bg-gray-50">
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      <button className="w-10 h-10 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600">1</button>
                      <button className="w-10 h-10 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">2</button>
                      <button className="w-10 h-10 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">3</button>
                      <span className="px-2 text-gray-400">...</span>
                    </div>
                    <Button variant="outline" size="sm" className="border-gray-200 text-gray-600 hover:bg-gray-50">
                      Next
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <Card className="text-center py-20">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MagnifyingGlassIcon className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">No tasks found</h3>
                  <p className="text-gray-600 mb-6">
                    {filters.category || filters.status || filters.search || filters.location
                      ? 'Try adjusting your filters or search terms'
                      : 'No tasks are available at the moment. Check back later!'}
                  </p>
                  <Button onClick={handleReset} className="bg-blue-600 hover:bg-blue-700">
                    Clear Filters
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
