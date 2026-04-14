import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { useTaskStore } from '../stores/task.store';
import { TaskCard } from '../components/task/TaskCard';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card } from '../components/common/Card';
import { TaskCategory, TaskStatus } from '../types';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ClockIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const ITEMS_PER_PAGE = 6;

const categories: Array<{ value: TaskCategory; label: string; icon: string }> = [
  { value: TaskCategory.DELIVERY, label: 'Delivery', icon: '🚚' },
  { value: TaskCategory.HOME_REPAIR, label: 'Home Repair', icon: '🔧' },
  { value: TaskCategory.CLEANING, label: 'Cleaning', icon: '✨' },
  { value: TaskCategory.IT_SUPPORT, label: 'IT Support', icon: '💻' },
  { value: TaskCategory.PERSONAL_ASSISTANT, label: 'Personal Assistant', icon: '👤' },
  { value: TaskCategory.MOVING, label: 'Moving', icon: '📦' },
  { value: TaskCategory.TUTORING, label: 'Tutoring', icon: '📚' },
  { value: TaskCategory.OTHER, label: 'Other', icon: '⭐' },
];

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

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { tasks, filters, isLoading, fetchTasks, setFilters, clearFilters } = useTaskStore();

  const [currentPage, setCurrentPage] = useState(1);
  const [draftSearch, setDraftSearch] = useState(filters.search || '');
  const [draftStatus, setDraftStatus] = useState<string>(filters.status || '');
  const [draftMinBudget, setDraftMinBudget] = useState<string>(
    filters.minBudget != null ? String(filters.minBudget) : ''
  );
  const [isDraftDirty, setIsDraftDirty] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const effectiveSearch = isDraftDirty ? draftSearch : (filters.search || '');
  const effectiveStatus = isDraftDirty ? draftStatus : String(filters.status || '');
  const effectiveMinBudget = isDraftDirty
    ? draftMinBudget
    : (filters.minBudget != null ? String(filters.minBudget) : '');

  const categoryCounts = useMemo(
    () =>
      tasks.reduce<Record<string, number>>((acc, task) => {
        acc[task.category] = (acc[task.category] || 0) + 1;
        return acc;
      }, {}),
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filters.category && task.category !== filters.category) return false;
      if (filters.status && task.status !== filters.status) return false;

      if (
        filters.search &&
        !task.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !task.description.toLowerCase().includes(filters.search.toLowerCase())
      ) return false;

      if (filters.minBudget != null) {
        const budget = task.budget ?? task.aiSuggestedPrice ?? 0;
        if (budget < filters.minBudget) return false;
      }

      return true;
    });
  }, [filters, tasks]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedTasks = filteredTasks.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);
  const visiblePages = getVisiblePages(safePage, totalPages);

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setFilters({
      search: effectiveSearch.trim() || undefined,
      status: effectiveStatus ? (effectiveStatus as TaskStatus) : undefined,
      minBudget: effectiveMinBudget.trim() ? Number(effectiveMinBudget) : undefined,
    });
    setIsDraftDirty(false);
  };

  const resetAllFilters = () => {
    setCurrentPage(1);
    setDraftSearch('');
    setDraftStatus('');
    setDraftMinBudget('');
    setIsDraftDirty(false);
    clearFilters();
  };

  const toggleCategory = (value: TaskCategory) => {
    setCurrentPage(1);
    setFilters({
      category: filters.category === value ? undefined : value,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="pointer-events-none fixed inset-0 opacity-[0.35]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.12) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
      </div>

      <section className="relative container mx-auto px-4 pt-8 pb-5">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 shadow-xl">
          <div className="grid gap-8 p-6 md:p-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide text-blue-100">
                <SparklesIcon className="h-4 w-4" />
                Trusted marketplace for daily tasks
              </div>
              <h1 className="text-3xl font-bold leading-tight text-white md:text-5xl">
                Find skilled helpers fast, with clear budgets and verified task flow
              </h1>
              <p className="mt-4 max-w-2xl text-base text-blue-100 md:text-lg">
                Browse available tasks, filter by status and budget, and connect with trusted providers in Ho Chi Minh City.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-blue-100">
                  {tasks.length} live tasks
                </span>
                <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-sm text-blue-100">
                  Real-time updates
                </span>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-white backdrop-blur">
                  <p className="text-xs uppercase tracking-wide text-blue-100">Open market</p>
                  <p className="mt-2 text-3xl font-bold">{tasks.length}</p>
                  <p className="mt-1 text-sm text-blue-100">Total listed tasks</p>
                </div>
                <div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-white backdrop-blur">
                  <p className="text-xs uppercase tracking-wide text-blue-100">Execution</p>
                  <p className="mt-2 text-3xl font-bold">{filteredTasks.length}</p>
                  <p className="mt-1 text-sm text-blue-100">Matching your filters</p>
                </div>
                <div className="col-span-2 rounded-2xl border border-white/20 bg-white/10 p-4 text-blue-50 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheckIcon className="h-5 w-5" />
                      <span className="text-sm font-semibold">Verified workflow</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <ClockIcon className="h-4 w-4" />
                      <span>Updated now</span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-blue-100">
                    Clean filters, stable statuses, and consistent task data across pages.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur md:p-5">
          <form onSubmit={applyFilters} className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-center">
            <Input
              placeholder="Search tasks..."
              value={effectiveSearch}
              onChange={(e) => {
                setDraftSearch(e.target.value);
                setIsDraftDirty(true);
              }}
              className="md:col-span-4"
              leftIcon={<MagnifyingGlassIcon className="w-5 h-5" />}
            />
            <select
              value={effectiveStatus}
              onChange={(e) => {
                setDraftStatus(e.target.value);
                setIsDraftDirty(true);
              }}
              className="select-default md:col-span-3"
            >
              <option value="">All Status</option>
              <option value="OPEN">Open</option>
              <option value="BIDDING">Bidding</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PENDING_CONFIRMATION">Pending Confirmation</option>
              <option value="COMPLETED">Completed</option>
              <option value="AWAITING_PAYMENT">Awaiting Payment</option>
              <option value="PAID">Paid</option>
              <option value="DISPUTED">Disputed</option>
            </select>
            <Input
              type="number"
              placeholder="Min Budget"
              value={effectiveMinBudget}
              onChange={(e) => {
                setDraftMinBudget(e.target.value);
                setIsDraftDirty(true);
              }}
              className="md:col-span-3"
              leftIcon={<CurrencyDollarIcon className="w-5 h-5" />}
            />
            <div className="flex gap-2 md:col-span-2">
              <Button type="submit" className="flex-1">
                <FunnelIcon className="w-4 h-4 mr-2" />
                Apply
              </Button>
              <Button type="button" variant="outline" onClick={resetAllFilters}>
                <ArrowPathIcon className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      </section>

      <section className="relative container mx-auto px-4 pb-10">
        <Card className="mb-6 border border-slate-200 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Explore Categories</h2>
            <p className="text-sm text-slate-500">Click to filter quickly</p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => toggleCategory(category.value)}
                className={`rounded-xl border px-3 py-3 text-left transition-all ${
                  filters.category === category.value
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                }`}
              >
                <div className="text-2xl">{category.icon}</div>
                <p className="mt-1 text-sm font-semibold text-slate-800">{category.label}</p>
                <p className="text-xs text-slate-500">{categoryCounts[category.value] || 0} tasks</p>
              </button>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
              <p className="mt-4 text-dark-600">Loading tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <Card className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-dark-900 mb-2">No tasks found</h3>
              <p className="text-dark-600 mb-6 max-w-md mx-auto">
                Try adjusting your filters or be the first to post a task.
              </p>
              {user && (
                <Button onClick={() => navigate('/post-task')} size="lg">
                  Post Your First Task
                </Button>
              )}
            </Card>
          ) : (
            <>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-dark-600 text-lg">
                  Showing <span className="font-semibold text-dark-900">{filteredTasks.length}</span> tasks
                </p>
                <p className="text-sm text-slate-500">
                  Page {safePage} of {totalPages}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {paginatedTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>

              <div className="flex justify-center mt-10">
                <nav className="flex items-center space-x-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safePage <= 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  >
                    Previous
                  </Button>
                  {visiblePages.map((page, index) =>
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-2 text-slate-400">
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          page === safePage
                            ? 'bg-primary-100 text-primary-700'
                            : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safePage >= totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  >
                    Next
                  </Button>
                </nav>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};
