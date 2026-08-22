import React from 'react';

const LoadingSpinner = ({ size = 'md', message, className = '' }) => {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`${sizes[size]} animate-spin rounded-full border-gray-200 border-t-primary-600`}
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
      {message && <p className="mt-2 text-sm text-gray-500">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
