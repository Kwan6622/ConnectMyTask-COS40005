import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaskStore } from '../stores/task.store';
import { useAuthStore } from '../stores/auth.store';
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
import { api } from '../services/api';

function getVisiblePages(currentPage: number, totalPages: number): Array<number | '...'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, '...', totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
}

function taskPriorityScore(task: { status: string; isOverdue?: boolean }): number {
  if (task.isOverdue) return 6.5;
  const rank: Record<string, number> = {
    OPEN: 1,
    BIDDING: 2,
    ASSIGNED: 3,
    IN_PROGRESS: 4,
    PENDING_CONFIRMATION: 5,
    DISPUTED: 6,
    COMPLETED: 7,
    AWAITING_PAYMENT: 8,
    PAID: 9,
    CANCELLED: 10,
  };
  return rank[String(task.status || '').toUpperCase()] ?? 50;
}

export const TaskBrowsePage: React.FC = () => {
  const ITEMS_PER_PAGE = 4;
  const navigate = useNavigate();
  const { tasks, filters, isLoading, fetchTasks, setFilters, clearFilters } = useTaskStore();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [isSearchDraftDirty, setIsSearchDraftDirty] = useState(false);
  const [sortBy, setSortBy] = useState('opportunity');
  const [currentPage, setCurrentPage] = useState(1);
  const [browseMode, setBrowseMode] = useState<'all' | 'suggested'>('all');
  const [suggestedTasks, setSuggestedTasks] = useState<any[]>([]);
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
  }, []);

  useEffect(() => {
    if (browseMode !== 'suggested') return;
    if (String(user?.role || '').toUpperCase() !== 'PROVIDER') return;
    api.tasks
      .getSuggestedMe()
      .then((response) => {
        setSuggestedTasks(Array.isArray(response.data) ? response.data : []);
      })
      .catch(() => {
        setSuggestedTasks([]);
      });
  }, [browseMode, user?.id, user?.role]);

  const sourceTasks = browseMode === 'suggested' ? suggestedTasks : tasks;
  const browseVisibleTasks = useMemo(
    () =>
      sourceTasks.filter((task) => {
        const status = String(task.status || '').toUpperCase();
        const isAssigned = status === TaskStatus.ASSIGNED;
        const isOverdueUnassigned = Boolean(task.isOverdue) && !task.assignedProviderId;
        return !isAssigned && !isOverdueUnassigned;
      }),
    [sourceTasks]
  );

  const effectiveSearch = isSearchDraftDirty ? searchQuery : (filters.search || '');
  const effectiveLocation = isSearchDraftDirty ? locationQuery : (filters.location || '');

  const applyFilterUpdate = (nextFilters: Partial<typeof filters>) => {
    setCurrentPage(1);
    setFilters(nextFilters);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setFilters({
      search: effectiveSearch,
      location: effectiveLocation,
    });
    setIsSearchDraftDirty(false);
  };

  const handleCategoryClick = (categoryValue: TaskCategory) => {
    applyFilterUpdate({
      category: filters.category === categoryValue ? undefined : categoryValue,
    });
  };

  const handleStatusClick = (statusValue: TaskStatus) => {
    applyFilterUpdate({
      status: filters.status === statusValue ? undefined : statusValue,
    });
  };

  const handleReset = () => {
    setSearchQuery('');
    setLocationQuery('');
    setIsSearchDraftDirty(false);
    setCurrentPage(1);
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
    count: browseVisibleTasks.filter((task) => task.category === category.value).length,
  }));

  const statuses: Array<{ value: TaskStatus; label: string; color: string }> = [
    { value: TaskStatus.OPEN, label: 'Open', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: TaskStatus.BIDDING, label: 'Bidding', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { value: TaskStatus.ASSIGNED, label: 'Assigned', color: 'bg-green-100 text-green-700 border-green-200' },
    { value: TaskStatus.IN_PROGRESS, label: 'In Progress', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { value: TaskStatus.PENDING_CONFIRMATION, label: 'Pending Confirmation', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { value: TaskStatus.COMPLETED, label: 'Completed', color: 'bg-dark-100 text-dark-700 border-dark-200' },
    { value: TaskStatus.AWAITING_PAYMENT, label: 'Awaiting Payment', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { value: TaskStatus.PAID, label: 'Paid', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { value: TaskStatus.DISPUTED, label: 'Disputed', color: 'bg-red-100 text-red-700 border-red-200' },
  ];

  const filteredTasks = useMemo(() => browseVisibleTasks.filter((task) => {
    if (filters.category && task.category !== filters.category) {
      return false;
    }

    if (filters.status && task.status !== filters.status) return false;

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
    const deadlineA = new Date(a.dueDate || a.deadline || 0).getTime();
    const deadlineB = new Date(b.dueDate || b.deadline || 0).getTime();

    switch (sortBy) {
      case 'opportunity': {
        const priorityDiff = taskPriorityScore(a) - taskPriorityScore(b);
        if (priorityDiff !== 0) return priorityDiff;

        const statusA = String(a.status || '').toUpperCase();
        const statusB = String(b.status || '').toUpperCase();
        const isOpportunityA = statusA === TaskStatus.OPEN || statusA === TaskStatus.BIDDING;
        const isOpportunityB = statusB === TaskStatus.OPEN || statusB === TaskStatus.BIDDING;

        if (isOpportunityA && isOpportunityB) {
          const safeDeadlineA = Number.isNaN(deadlineA) || deadlineA <= 0 ? Number.MAX_SAFE_INTEGER : deadlineA;
          const safeDeadlineB = Number.isNaN(deadlineB) || deadlineB <= 0 ? Number.MAX_SAFE_INTEGER : deadlineB;
          if (safeDeadlineA !== safeDeadlineB) {
            return safeDeadlineA - safeDeadlineB;
          }
        }

        return dateB - dateA;
      }
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
  }), [browseVisibleTasks, filters, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedTasks = filteredTasks.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);
  const visiblePages = getVisiblePages(safePage, totalPages);

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

            <div className="max-w-3xl mx-auto rounded-2xl border border-white/30 bg-white/10 px-6 py-4 text-white/90">
              Use the sticky filter panel below for search, location, category, status, and budget.
            </div>
            
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
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-4">
            <Card className="sticky top-24 shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <div className="p-7 max-h-[calc(100vh-7rem)] overflow-y-auto">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <FunnelIcon className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                </div>

                <form onSubmit={handleSearch} className="mb-8 space-y-3">
                  <Input
                    placeholder="Search by title/description"
                    value={effectiveSearch}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchDraftDirty(true);
                    }}
                    className="h-10 border-gray-200 focus:ring-2 focus:ring-blue-500"
                    leftIcon={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
                  />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <MapPinIcon className="w-4 h-4" />
                    </span>
                    <select
                      value={effectiveLocation}
                      onChange={(e) => {
                        setLocationQuery(e.target.value);
                        setIsSearchDraftDirty(true);
                      }}
                      className="w-full h-10 rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {locationOptions.map((option) => (
                        <option key={option || 'all'} value={option}>
                          {option || 'All locations'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button type="submit" className="w-full">
                    Apply Search
                  </Button>
                </form>
                
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
                  <div className="grid grid-cols-2 gap-2">
                    {statuses.map((status) => (
                      <button
                        key={status.value}
                        onClick={() => handleStatusClick(status.value)}
                        className={`
                          w-full px-3 py-2 rounded-lg border text-sm font-medium text-center transition-all duration-200
                          ${
                            filters.status === status.value
                              ? status.color
                              : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Budget Range */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <CurrencyDollarIcon className="w-4 h-4" />
                    Budget Range
                  </h3>
                  <div className="space-y-3">
                    <Input
                      type="number"
                      placeholder="Min Budget"
                      value={filters.minBudget ?? ''}
                      onChange={(e) =>
                        applyFilterUpdate({
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
                        applyFilterUpdate({
                          maxBudget: e.target.value === '' ? undefined : Number(e.target.value),
                        })
                      }
                      className="h-10 border-gray-200 focus:ring-2 focus:ring-blue-500"
                      leftIcon={<CurrencyDollarIcon className="w-4 h-4 text-gray-400" />}
                    />
                  </div>
                </div>
                
                {/* Reset */}
                {(filters.category || filters.status || filters.search || filters.location || filters.minBudget != null || filters.maxBudget != null) && (
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
          <div className="lg:col-span-8">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {filteredTasks.length} {filteredTasks.length === 1 ? 'Task' : 'Tasks'} Found
                </h2>
                <p className="text-gray-600 mt-1">
                  {browseMode === 'suggested'
                    ? 'Suggested for you based on your specialties and district'
                    : (filters.category || filters.status || filters.search || filters.location || filters.minBudget != null || filters.maxBudget != null
                    ? 'Matching your filters'
                    : 'Showing all available tasks')}
                </p>
              </div>
              
              {/* Sort Options */}
              <div className="flex items-center gap-3">
                {String(user?.role || '').toUpperCase() === 'PROVIDER' && (
                  <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
                    <button
                      onClick={() => {
                        setBrowseMode('all');
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 text-sm rounded-md ${
                        browseMode === 'all' ? 'bg-blue-600 text-white' : 'text-gray-600'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => {
                        setBrowseMode('suggested');
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 text-sm rounded-md ${
                        browseMode === 'suggested' ? 'bg-blue-600 text-white' : 'text-gray-600'
                      }`}
                    >
                      Suggested
                    </button>
                  </div>
                )}
                <span className="text-sm text-gray-600">Sort by:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="opportunity">Best Opportunities</option>
                  <option value="recent">Most Recent</option>
                  <option value="priceLow">Budget: Low to High</option>
                  <option value="priceHigh">Budget: High to Low</option>
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
                  {paginatedTasks.map((task) => (
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
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={safePage <= 1}
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      className="border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      {visiblePages.map((page, index) =>
                        page === '...' ? (
                          <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                            ...
                          </span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                              page === safePage
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={safePage >= totalPages}
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      className="border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
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
