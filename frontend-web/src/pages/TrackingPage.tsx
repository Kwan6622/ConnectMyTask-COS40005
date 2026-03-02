import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import toast from 'react-hot-toast';
import {
  MapPinIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  SparklesIcon,
  UserCircleIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  speed?: number;
}

interface TrackingData {
  taskId: string;
  providerId: string;
  currentLocation: Location;
  taskLocation: Location;
  distanceKm: number;
  isAtLocation: boolean;
  estimatedArrival?: string;
  routePath: Location[];
}

export const TrackingPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    fetchTrackingData();

    if (autoRefresh) {
      const interval = setInterval(fetchTrackingData, 5000);
      return () => clearInterval(interval);
    }
  }, [taskId, autoRefresh]);

  const fetchTrackingData = async () => {
    if (!taskId) return;

    try {
      const mockData: TrackingData = {
        taskId,
        providerId: 'provider-123',
        currentLocation: {
          latitude: 10.762622,
          longitude: 106.660172,
          accuracy: 15,
          timestamp: new Date().toISOString(),
          speed: 45,
        },
        taskLocation: {
          latitude: 10.776589,
          longitude: 106.700981,
          accuracy: 5,
          timestamp: new Date().toISOString(),
        },
        distanceKm: 3.2,
        isAtLocation: false,
        estimatedArrival: new Date(Date.now() + 12 * 60 * 1000).toISOString(),
        routePath: [
          {
            latitude: 10.762622,
            longitude: 106.660172,
            accuracy: 15,
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          },
          {
            latitude: 10.768234,
            longitude: 106.675234,
            accuracy: 12,
            timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          },
          {
            latitude: 10.762622,
            longitude: 106.660172,
            accuracy: 15,
            timestamp: new Date().toISOString(),
          },
        ],
      };

      setTrackingData(mockData);
      setLastUpdate(new Date());
    } catch (error) {
      toast.error('Failed to fetch tracking data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualRefresh = () => {
    setIsLoading(true);
    fetchTrackingData();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto" />
          <p className="mt-4 text-dark-600">Loading tracking data...</p>
        </div>
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center py-16">
          <div className="text-6xl mb-4">🗺️</div>
          <h2 className="text-2xl font-bold text-dark-900 mb-2">No tracking data</h2>
          <p className="text-dark-600">Tracking data is not available at the moment.</p>
        </Card>
      </div>
    );
  }

  const estimatedArrivalDate = trackingData.estimatedArrival
    ? new Date(trackingData.estimatedArrival)
    : null;

  return (
    <div className="min-h-screen bg-dark-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-dark-900 mb-2 flex items-center gap-3">
            <ArrowTrendingUpIcon className="w-8 h-8 text-primary-600" />
            Real-Time Tracking
          </h1>
          <p className="text-dark-600">Track your service provider&apos;s location</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Map Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map Card */}
            <Card className="overflow-hidden">
              <div className="h-80 flex items-center justify-center bg-gradient-to-br from-primary-100 via-blue-50 to-accent-100 relative">
                {/* Animated background */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl animate-float" />
                  <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-accent-500/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '1s' }} />
                </div>

                <div className="text-center relative z-10">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-xl mb-4 animate-bounce-soft">
                    <MapPinIcon className="w-10 h-10 text-primary-600" />
                  </div>
                  <p className="text-dark-600 text-lg mb-2">Map view would be displayed here</p>
                  <div className="flex items-center justify-center gap-2 text-sm text-dark-500">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                      Provider location
                    </span>
                    <span className="text-dark-300">|</span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-success-500 rounded-full" />
                      Task location
                    </span>
                  </div>
                </div>

                {/* Location markers */}
                <div className="absolute top-1/3 left-1/3 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="relative">
                    <div className="w-4 h-4 bg-primary-500 rounded-full border-2 border-white shadow-lg" />
                    <div className="absolute inset-0 w-4 h-4 bg-primary-500 rounded-full animate-ping opacity-50" />
                  </div>
                </div>

                <div className="absolute bottom-1/3 right-1/3 transform -translate-x-1/2 translate-y-1/2">
                  <div className="relative">
                    <div className="w-4 h-4 bg-success-500 rounded-full border-2 border-white shadow-lg" />
                  </div>
                </div>
              </div>
            </Card>

            {/* Route History */}
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <MapPinIcon className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-lg font-bold text-dark-900">Route History</h2>
              </div>
              <div className="space-y-4">
                {trackingData.routePath.map((location, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 pb-4 border-b border-dark-100 last:border-0 last:pb-0"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-dark-600 mb-1">
                        {new Date(location.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </p>
                      <p className="text-sm text-dark-500">
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                        {location.speed && (
                          <span className="ml-2 text-primary-600 font-medium">
                            • Speed: {location.speed} km/h
                          </span>
                        )}
                      </p>
                    </div>
                    {index === trackingData.routePath.length - 1 && (
                      <span className="badge-primary">Current</span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card
              className={`border-2 ${
                trackingData.isAtLocation
                  ? 'border-success-200 bg-success-50/50'
                  : 'border-yellow-200 bg-yellow-50/50'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                {trackingData.isAtLocation ? (
                  <div className="p-3 bg-success-100 rounded-xl">
                    <CheckCircleIcon className="w-8 h-8 text-success-600" />
                  </div>
                ) : (
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600" />
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-bold text-dark-900">
                    {trackingData.isAtLocation ? 'At Location' : 'En Route'}
                  </h2>
                  <p className={`text-sm ${trackingData.isAtLocation ? 'text-success-700' : 'text-yellow-700'}`}>
                    {trackingData.isAtLocation
                      ? 'Provider has arrived'
                      : `Provider is ${trackingData.distanceKm.toFixed(1)} km away`}
                  </p>
                </div>
              </div>
              {!trackingData.isAtLocation && (
                <div className="w-full bg-white/60 rounded-full h-2 mb-2">
                  <div
                    className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100 - (trackingData.distanceKm / 10) * 100, 100)}%` }}
                  />
                </div>
              )}
            </Card>

            {/* Distance & Time */}
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <SparklesIcon className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-lg font-bold text-dark-900">Details</h2>
              </div>
              <div className="space-y-5">
                <div className="flex items-center justify-between p-4 bg-dark-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <MapPinIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-dark-600">Distance</span>
                  </div>
                  <span className="text-2xl font-bold text-dark-900">{trackingData.distanceKm.toFixed(1)} km</span>
                </div>

                {estimatedArrivalDate && !trackingData.isAtLocation && (
                  <div className="flex items-center justify-between p-4 bg-dark-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent-100 rounded-lg">
                        <ClockIcon className="w-5 h-5 text-accent-600" />
                      </div>
                      <span className="text-dark-600">Est. Arrival</span>
                    </div>
                    <span className="text-xl font-semibold text-dark-900">
                      {estimatedArrivalDate.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 bg-dark-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-success-100 rounded-lg">
                      <SparklesIcon className="w-5 h-5 text-success-600" />
                    </div>
                    <span className="text-dark-600">Accuracy</span>
                  </div>
                  <span className="text-xl font-semibold text-dark-900">±{trackingData.currentLocation.accuracy} m</span>
                </div>
              </div>
            </Card>

            {/* Last Update */}
            <Card>
              <p className="text-sm text-dark-500 mb-4">
                Last update: <span className="font-medium text-dark-700">{lastUpdate?.toLocaleTimeString()}</span>
              </p>
              <div className="space-y-3">
                <Button
                  onClick={handleManualRefresh}
                  variant="outline"
                  className="w-full"
                  disabled={isLoading}
                >
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-dark-50 rounded-xl transition-colors">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-dark-700">Auto-refresh every 5s</span>
                </label>
              </div>
            </Card>

            {/* Provider Info */}
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <UserCircleIcon className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-lg font-bold text-dark-900">Provider</h2>
              </div>
              <div className="flex items-center gap-4 p-4 bg-dark-50 rounded-xl mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  J
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-dark-900">John Doe</p>
                  <div className="flex items-center gap-1 text-sm text-dark-600">
                    <span className="text-yellow-500">⭐</span>
                    <span className="font-medium">4.8</span>
                    <span className="text-dark-400">(42 reviews)</span>
                  </div>
                </div>
              </div>
              <Button className="w-full" variant="outline">
                Contact Provider
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

