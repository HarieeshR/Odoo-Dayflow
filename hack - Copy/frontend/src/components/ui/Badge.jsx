import React from 'react';

const Badge = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = ''
}) => {
  const variants = {
    success: 'bg-success-50 text-success-600 border border-success-200',
    danger: 'bg-danger-50 text-danger-600 border border-danger-200',
    warning: 'bg-warning-50 text-warning-600 border border-warning-200',
    info: 'bg-primary-50 text-primary-600 border border-primary-200',
    neutral: 'bg-gray-100 text-gray-700 border border-gray-200'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm'
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
