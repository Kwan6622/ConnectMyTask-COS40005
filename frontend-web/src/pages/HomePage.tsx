import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { useTaskStore } from '../stores/task.store';
import { TaskCard } from '../components/task/TaskCard';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card } from '../components/common/Card';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { tasks, filters, isLoading, fetchTasks, setFilters } = useTaskStore();

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTasks();
  };

  const categoryCounts = useMemo(
    () =>
      tasks.reduce<Record<string, number>>((acc, task) => {
        acc[task.category] = (acc[task.category] || 0) + 1;
        return acc;
      }, {}),
    [tasks]
  );

  const categories = [
    { value: 'DELIVERY', label: 'Delivery', icon: '🚚', color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { value: 'HOME_REPAIR', label: 'Home Repair', icon: '🔧', color: 'bg-orange-50 text-orange-600 border-orange-200' },
    { value: 'CLEANING', label: 'Cleaning', icon: '✨', color: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
    { value: 'IT_SUPPORT', label: 'IT Support', icon: '💻', color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
    { value: 'PERSONAL_ASSISTANT', label: 'Personal Assistant', icon: '👤', color: 'bg-purple-50 text-purple-600 border-purple-200' },
  ].map((category) => ({
    ...category,
    count: categoryCounts[category.value] || 0,
  }));

  return (
    <div className="min-h-screen bg-dark-50">
      {/* Hero Section */}
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden">
        {/* Professional Background Pattern */}
        <div className="absolute inset-0">
          {/* Subtle Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `
                linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }}
          />
          
          {/* Floating Shapes */}
          <div className="absolute top-20 right-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-40 left-10 w-96 h-96 bg-indigo-200/15 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-purple-200/10 rounded-full blur-2xl animate-pulse delay-500" />
          
          {/* Decorative Lines */}
          <svg className="absolute top-0 left-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#3b82f6" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative container mx-auto px-4 py-20 md:py-28 lg:py-36">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="text-left">
                {/* Badge */}
                <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-sm font-medium mb-6">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                  AI-Powered Task Matching
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                  Find Trusted Help for
                  <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Any Task</span>
                </h1>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  Connect with skilled professionals for delivery, repairs, cleaning,
                  IT support, and more. Our AI-powered matching ensures the perfect fit for your needs.
                </p>

                <Button
                  size="lg"
                  onClick={() => navigate('/browse-tasks')}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl px-8 h-14 text-lg font-semibold"
                >
                  Search Tasks
                </Button>
                
                {/* Trust Indicators */}
                <div className="flex items-center gap-8 mt-8 text-gray-600 text-sm">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Verified Providers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>4.9 Rating</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                      <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15a24.98 24.98 0 01-8-1.308z" />
                    </svg>
                    <span>Secure Payments</span>
                  </div>
                </div>
              </div>
              
              {/* Right Side - Hero Image/Illustration */}
              <div className="relative">
                <div className="relative z-10">
                  {/* Main Illustration Card */}
                  <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                    <div className="space-y-6">
                      {/* Task Categories */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-xl p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
                          <div className="text-3xl mb-2">🚚</div>
                          <p className="text-sm font-medium text-gray-700">Delivery</p>
                          <p className="text-xs text-gray-500">{categories.find((c) => c.value === 'DELIVERY')?.count || 0} tasks</p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
                          <div className="text-3xl mb-2">🔧</div>
                          <p className="text-sm font-medium text-gray-700">Repairs</p>
                          <p className="text-xs text-gray-500">{categories.find((c) => c.value === 'HOME_REPAIR')?.count || 0} tasks</p>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
                          <div className="text-3xl mb-2">✨</div>
                          <p className="text-sm font-medium text-gray-700">Cleaning</p>
                          <p className="text-xs text-gray-500">{categories.find((c) => c.value === 'CLEANING')?.count || 0} tasks</p>
                        </div>
                        <div className="bg-orange-50 rounded-xl p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
                          <div className="text-3xl mb-2">💻</div>
                          <p className="text-sm font-medium text-gray-700">IT Support</p>
                          <p className="text-xs text-gray-500">{categories.find((c) => c.value === 'IT_SUPPORT')?.count || 0} tasks</p>
                        </div>
                      </div>
                      
                      {/* Quick Stats */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-gray-900">1,500+</p>
                            <p className="text-sm text-gray-600">Tasks Completed</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">98%</p>
                            <p className="text-sm text-gray-600">Satisfaction</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">300+</p>
                            <p className="text-sm text-gray-600">Providers</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating Elements */}
                  <div className="absolute -top-4 -right-4 bg-yellow-400 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg animate-bounce">
                    <span className="text-xl">⭐</span>
                  </div>
                  <div className="absolute -bottom-4 -left-4 bg-green-500 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg animate-pulse">
                    <span className="text-xl">✓</span>
                  </div>
                </div>
                
                {/* Background Decorations */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl -z-10"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-4">
            Popular Services
          </div>
          <h2 className="text-4xl font-bold text-dark-900 mb-4">
            Explore Categories
          </h2>
          <p className="text-dark-600 text-lg max-w-2xl mx-auto">
            Find the perfect service provider for your specific needs
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {categories.map((category, index) => (
            <div
              key={category.value}
              onClick={() => setFilters({ category: category.value as any })}
              className={`
                group relative p-6 rounded-2xl border-2 text-center transition-all duration-300 cursor-pointer
                hover:shadow-xl hover:-translate-y-1 hover:scale-105
                ${filters.category === category.value
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : 'border-gray-100 bg-white hover:border-blue-200'
                }
              `}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{category.icon}</div>
              <p className="font-semibold text-dark-800 group-hover:text-blue-600 transition-colors">{category.label}</p>
              <div className="mt-2 text-xs text-gray-500">{category.count} tasks</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-y border-gray-100">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '1,500+', label: 'Tasks Completed', icon: '✓' },
              { value: '98%', label: 'Satisfaction Rate', icon: '★' },
              { value: '300+', label: 'Verified Providers', icon: '👥' },
              { value: '24/7', label: 'AI Support', icon: '🤖' }
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                  {stat.value}
                </div>
                <p className="text-dark-600 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters & Tasks */}
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Search tasks..."
                value={filters.search || ''}
                onChange={(e) => setFilters({ search: e.target.value })}
                leftIcon={<MagnifyingGlassIcon className="w-5 h-5" />}
              />
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ status: e.target.value as any })}
                className="select-default"
              >
                <option value="">All Status</option>
                <option value="POSTED">Posted</option>
                <option value="BIDDING">Bidding</option>
                <option value="ASSIGNED">Assigned</option>
              </select>
              <Input
                type="number"
                placeholder="Min Budget"
                value={filters.minBudget || ''}
                onChange={(e) => setFilters({ minBudget: Number(e.target.value) })}
                leftIcon={<CurrencyDollarIcon className="w-5 h-5" />}
              />
              <div className="flex space-x-2">
                <Button type="submit" className="flex-1">
                  <FunnelIcon className="w-4 h-4 mr-2" />
                  Apply
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFilters({})}
                >
                  <ArrowPathIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </form>
        </Card>

        {/* Tasks Grid */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
              <p className="mt-4 text-dark-600">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <Card className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-dark-900 mb-2">No tasks found</h3>
              <p className="text-dark-600 mb-6 max-w-md mx-auto">
                Try adjusting your filters or be the first to post a task!
              </p>
              {user && (
                <Button onClick={() => navigate('/post-task')} size="lg">
                  Post Your First Task
                </Button>
              )}
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-dark-600">
                  Showing <span className="font-semibold text-dark-900">{tasks.length}</span> tasks
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>

              {/* Pagination */}
              <div className="flex justify-center mt-12">
                <nav className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    Previous
                  </Button>
                  <span className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg font-medium">
                    1
                  </span>
                  <Button variant="outline" size="sm">
                    Next
                  </Button>
                </nav>
              </div>
            </>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative bg-gradient-to-br from-slate-800 via-blue-800 to-indigo-900 py-20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-black/20"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-6 border border-white/20">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              Join Our Community
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of users who trust ConnectMyTask for their task needs. 
              Get started today and experience the difference.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="bg-white text-blue-600 shadow-2xl hover:bg-gray-50 hover:scale-105 transition-all duration-300 px-8 py-4 text-lg font-semibold border-0"
                onClick={() => navigate('/post-task')}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Post a Task
              </Button>
              
              <button
                className="h-14 px-8 py-3.5 text-lg border-2 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/50 font-semibold shadow-xl rounded-xl transition-all duration-300 backdrop-blur-sm hover:scale-105"
                onClick={() => navigate('/browse-tasks')}
              >
                <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Browse Tasks
              </button>
            </div>
            
            {/* Social Proof */}
            <div className="mt-12 flex items-center justify-center gap-8 text-white/60 text-sm">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white"></div>
                  <div className="w-8 h-8 bg-green-500 rounded-full border-2 border-white"></div>
                  <div className="w-8 h-8 bg-purple-500 rounded-full border-2 border-white"></div>
                </div>
                <span>10,000+ Active Users</span>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="ml-1">4.9/5 Rating</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
