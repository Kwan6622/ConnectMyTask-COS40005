import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useTaskStore } from '../stores/task.store';
import { api } from '../services/api';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card } from '../components/common/Card';
import toast from 'react-hot-toast';
import {
  SparklesIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  MapPinIcon,
  DocumentTextIcon,
  TagIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  LightBulbIcon,
  ArrowRightIcon,
  PaperClipIcon,
} from '@heroicons/react/24/outline';

interface TaskFormData {
  title: string;
  description: string;
  category: string;
  location: string;
  latitude?: number;
  longitude?: number;
  budget?: number;
  deadline?: string;
  imageUrls?: string[];
}

export const TaskPostPage: React.FC = () => {
  const navigate = useNavigate();
  const { createTask, tasks } = useTaskStore();
  const [aiPrice, setAiPrice] = useState<number | null>(null);
  const [isGettingAiPrice, setIsGettingAiPrice] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const categoryCounts = tasks.reduce<Record<string, number>>((acc, task) => {
    acc[task.category] = (acc[task.category] || 0) + 1;
    return acc;
  }, {});

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<TaskFormData>();

  const categories = [
    { value: 'DELIVERY', label: 'Delivery', icon: '🚚', color: 'bg-blue-50 text-blue-600' },
    { value: 'HOME_REPAIR', label: 'Home Repair', icon: '🔧', color: 'bg-orange-50 text-orange-600' },
    { value: 'CLEANING', label: 'Cleaning', icon: '✨', color: 'bg-cyan-50 text-cyan-600' },
    { value: 'IT_SUPPORT', label: 'IT Support', icon: '💻', color: 'bg-indigo-50 text-indigo-600' },
    { value: 'PERSONAL_ASSISTANT', label: 'Personal Assistant', icon: '👤', color: 'bg-purple-50 text-purple-600' },
    { value: 'MOVING', label: 'Moving', icon: '📦', color: 'bg-yellow-50 text-yellow-600' },
    { value: 'TUTORING', label: 'Tutoring', icon: '📚', color: 'bg-green-50 text-green-600' },
    { value: 'OTHER', label: 'Other', icon: '⭐', color: 'bg-gray-50 text-gray-600' },
  ];

  const handleGetAiPrice = async () => {
    const formData = watch();
    if (!formData.category || !formData.location) {
      toast.error('Please select category and location first');
      return;
    }

    setIsGettingAiPrice(true);
    try {
      const response = await api.ai.predictPrice({
        category: formData.category,
        location: formData.location,
        budget: formData.budget,
        complexity: 'MEDIUM',
        urgency: 'NORMAL',
      });
      setAiPrice(response.data.aiSuggestedPrice);
      toast.success('AI price suggestion generated!');
    } catch (error) {
      toast.error('Failed to get AI price suggestion');
    } finally {
      setIsGettingAiPrice(false);
    }
  };

  const onSubmit = async (data: TaskFormData) => {
    try {
      const taskData = {
        ...data,
        budget: data.budget ? Number(data.budget) : undefined,
        aiSuggestedPrice: aiPrice,
        imageUrls,
        createdById: 2,
      };

      const task = await createTask(taskData);
      toast.success('Task posted successfully!');
      navigate(`/tasks/${task.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to post task');
    }
  };

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
      
      <div className="relative container mx-auto px-4 py-12 max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Post Your Task
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Get Help for
            <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Any Task</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Describe what you need help with, and we&apos;ll match you with the best providers in minutes
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Task Title */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                    Task Title *
                  </label>
                  <Input
                    {...register('title', {
                      required: 'Title is required',
                      minLength: { value: 5, message: 'Title must be at least 5 characters' }
                    })}
                    placeholder="e.g., Fix air conditioner in living room"
                    className="h-12 text-lg border-gray-200 focus:ring-2 focus:ring-blue-500"
                    error={errors.title?.message}
                  />
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <LightBulbIcon className="w-4 h-4" />
                    Be specific to attract the right providers
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                    Description *
                  </label>
                  <textarea
                    {...register('description', {
                      required: 'Description is required',
                      minLength: { value: 20, message: 'Description must be at least 20 characters' }
                    })}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-lg"
                    placeholder="Describe your task in detail. Include any specific requirements, materials needed, or special instructions..."
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <span>⚠️</span> {errors.description.message}
                    </p>
                  )}
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <p className="text-sm text-blue-700 flex items-center gap-2">
                      <LightBulbIcon className="w-4 h-4" />
                      <span className="font-medium">Pro tip:</span> Detailed descriptions get 50% more responses and better quality providers
                    </p>
                  </div>
                </div>

                {/* Task Images */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <PaperClipIcon className="w-5 h-5 text-blue-600" />
                    Task Images (max 3)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={imageUrlInput}
                      onChange={(event) => setImageUrlInput(event.target.value)}
                      placeholder="Paste image URL"
                      className="h-12 text-lg border-gray-200 focus:ring-2 focus:ring-blue-500"
                    />
                    <Button
                      type="button"
                      disabled={!imageUrlInput.trim() || imageUrls.length >= 3}
                      onClick={() => {
                        if (!imageUrlInput.trim() || imageUrls.length >= 3) return;
                        setImageUrls((prev) => [...prev, imageUrlInput.trim()]);
                        setImageUrlInput('');
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">{imageUrls.length}/3</p>
                  {imageUrls.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      {imageUrls.map((url, index) => (
                        <div key={url + index} className="relative">
                          <img
                            src={url}
                            alt={`Task ${index + 1}`}
                            className="h-24 w-full rounded-lg object-cover border"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setImageUrls((prev) => prev.filter((_, i) => i !== index))
                            }
                            className="absolute top-2 right-2 bg-white/90 text-xs px-2 py-1 rounded shadow"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400">
                    Upload is disabled for now. Paste direct image URLs.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Category */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <TagIcon className="w-5 h-5 text-blue-600" />
                      Category *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {categories.map((cat) => (
                        <label
                          key={cat.value}
                          className={`
                            flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group
                            ${watch('category') === cat.value
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                            }
                          `}
                        >
                          <input
                            type="radio"
                            value={cat.value}
                            {...register('category', { required: 'Category is required' })}
                            className="sr-only"
                          />
                          <div className={`text-2xl group-hover:scale-110 transition-transform duration-200 ${
                            watch('category') === cat.value ? 'scale-110' : ''
                          }`}>
                            {cat.icon}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">{cat.label}</p>
                            <p className="text-xs text-gray-500">{categoryCounts[cat.value] ?? 0} tasks</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    {errors.category && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <span>⚠️</span> {errors.category.message}
                      </p>
                    )}
                  </div>

                  {/* Location */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <MapPinIcon className="w-5 h-5 text-blue-600" />
                      Location *
                    </label>
                    <Input
                      {...register('location', { required: 'Location is required' })}
                      placeholder="e.g., District 1, Ho Chi Minh City"
                      className="h-12 text-lg border-gray-200 focus:ring-2 focus:ring-blue-500"
                      leftIcon={<MapPinIcon className="w-5 h-5 text-gray-400" />}
                      error={errors.location?.message}
                    />
                    <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                      <p className="text-sm text-green-700 flex items-center gap-2">
                        <UserGroupIcon className="w-4 h-4" />
                        <span className="font-medium">Local providers respond faster</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Budget */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <CurrencyDollarIcon className="w-5 h-5 text-blue-600" />
                      Your Budget (USD)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register('budget', { min: 1 })}
                      placeholder="e.g., 50.00"
                      className="h-12 text-lg border-gray-200 focus:ring-2 focus:ring-blue-500"
                      leftIcon={<CurrencyDollarIcon className="w-5 h-5 text-gray-400" />}
                      error={errors.budget?.message}
                    />
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <ArrowRightIcon className="w-4 h-4" />
                      Leave empty for flexible budget
                    </p>
                  </div>

                  {/* Deadline */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <CalendarIcon className="w-5 h-5 text-blue-600" />
                      Deadline
                    </label>
                    <Input
                      type="datetime-local"
                      {...register('deadline')}
                      className="h-12 text-lg border-gray-200 focus:ring-2 focus:ring-blue-500"
                      leftIcon={<CalendarIcon className="w-5 h-5 text-gray-400" />}
                    />
                    <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                      <p className="text-sm text-orange-700 flex items-center gap-2">
                        <ClockIcon className="w-4 h-4" />
                        <span className="font-medium">Urgent tasks get priority</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* AI Price Suggestion */}
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-dashed border-blue-200 rounded-2xl p-8">
                  <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mr-4 shadow-lg">
                        <SparklesIcon className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">AI Price Suggestion</h3>
                        <p className="text-sm text-gray-600">Get an AI-powered price estimate based on market data</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={handleGetAiPrice}
                      disabled={isGettingAiPrice}
                      className="bg-white border-blue-200 text-blue-600 hover:bg-blue-50 shadow-lg px-6"
                    >
                      {isGettingAiPrice ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <SparklesIcon className="w-4 h-4 mr-2" />
                          Get AI Price
                        </>
                      )}
                    </Button>
                  </div>

                  {aiPrice ? (
                    <div className="bg-white rounded-xl p-6 border-2 border-green-200 shadow-lg">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                            <SparklesIcon className="w-4 h-4" />
                            AI Suggested Price
                          </p>
                          <p className="text-4xl font-bold text-green-600">${aiPrice.toFixed(2)}</p>
                          <p className="text-sm text-gray-600 mt-2">
                            Based on market rates, task complexity, and location
                          </p>
                        </div>
                        <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg">
                          <CheckCircleIcon className="w-6 h-6 text-green-500" />
                          <span className="text-green-700 font-semibold">Price optimized</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/80 rounded-xl p-6 text-center border border-blue-100">
                      <SparklesIcon className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                      <p className="text-gray-700 font-medium mb-2">Smart Pricing</p>
                      <p className="text-sm text-gray-600">
                        Get an AI-powered price suggestion based on thousands of similar tasks in your area
                      </p>
                    </div>
                  )}
                </div>

                {/* Submit */}
                <div className="flex justify-between items-center pt-8 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="border-gray-200 text-gray-600 hover:bg-gray-50 px-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl px-8 py-3 text-lg font-semibold min-w-[160px]"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2" />
                        Posting...
                      </>
                    ) : (
                      <>
                        Post Task
                        <ArrowRightIcon className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tips Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 shadow-lg">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <LightBulbIcon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Quick Tips</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 text-sm font-bold">✓</span>
                    </div>
                    <p className="text-sm text-gray-700">Be specific about requirements for better matches</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 text-sm font-bold">✓</span>
                    </div>
                    <p className="text-sm text-gray-700">Include photos when possible</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 text-sm font-bold">✓</span>
                    </div>
                    <p className="text-sm text-gray-700">Set realistic deadlines for quality work</p>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Stats Card */}
            <Card className="bg-white shadow-lg border-0">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Platform Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Providers</span>
                    <span className="text-lg font-bold text-blue-600">300+</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avg. Response Time</span>
                    <span className="text-lg font-bold text-green-600">15 min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <span className="text-lg font-bold text-purple-600">98%</span>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Support Card */}
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-100 shadow-lg">
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <UserGroupIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Need Help?</h3>
                <p className="text-sm text-gray-600 mb-4">Our support team is available 24/7 to assist you</p>
                <Button variant="outline" className="w-full border-yellow-200 text-yellow-700 hover:bg-yellow-50">
                  Contact Support
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
