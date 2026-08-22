import React from 'react';
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import Button from './Button';

const ErrorState = ({
  icon: Icon = HiOutlineExclamationCircle,
  message = 'Something went wrong.',
  onRetry,
  className = ''
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      <Icon className="mx-auto h-12 w-12 text-danger-500" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
      <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">{message}</p>
      {onRetry && (
        <div className="mt-6">
          <Button onClick={onRetry} variant="outline">
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
};

export default ErrorState;
