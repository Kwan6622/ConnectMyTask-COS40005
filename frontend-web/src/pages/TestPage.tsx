import React from 'react';

export const TestPage: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">
        React is working!
      </h1>
      <p className="text-lg text-gray-700 mb-8">
        If you can see this message, React, Routing, and CSS are all working correctly.
      </p>
      <div className="space-y-4">
        <div className="p-4 bg-green-100 border-2 border-green-500 rounded">
          <p className="text-green-800">✓ React Component Rendering</p>
        </div>
        <div className="p-4 bg-blue-100 border-2 border-blue-500 rounded">
          <p className="text-blue-800">✓ Tailwind CSS Styling</p>
        </div>
        <div className="p-4 bg-purple-100 border-2 border-purple-500 rounded">
          <p className="text-purple-800">✓ React Router Working</p>
        </div>
      </div>
    </div>
  );
};
