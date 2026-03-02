import React from 'react';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="bg-white/95 backdrop-blur-sm border border-gray-100 shadow-xl rounded-2xl p-8 md:p-10">
          <div className="mb-10">
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-sm font-medium mb-6">
              About ConnectMyTask
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Get things done, faster</h1>
            <p className="text-gray-600 leading-relaxed max-w-3xl">
              ConnectMyTask is a marketplace that connects clients with trusted service providers for delivery, repairs,
              cleaning, IT support, tutoring, and more.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Trusted matching</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                We help match the right provider to the right task using signals like category, location, and history.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-green-50 to-emerald-50 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Transparent pricing</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Set your budget, compare bids, and use AI suggestions to price tasks more confidently.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-yellow-50 to-orange-50 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Safe and reliable</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                We’re building trust features like verification and clearer task progress tracking.
              </p>
            </div>
          </div>

          <div className="mt-10 border-t border-gray-100 pt-8">
            <p className="text-sm text-gray-500">
              Want to collaborate or report an issue? Contact support through the app.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
