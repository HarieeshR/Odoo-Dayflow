import React from 'react';

const Card = ({
  title,
  subtitle,
  children,
  footer,
  padding = 'p-6',
  className = '',
  ...props
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-100 ${className}`} {...props}>
      {(title || subtitle) && (
        <div className={`border-b border-gray-100 px-6 py-4`}>
          {title && <h3 className="text-lg font-medium leading-6 text-gray-900">{title}</h3>}
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
      )}
      <div className={`${padding}`}>
        {children}
      </div>
      {footer && (
        <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 rounded-b-lg">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
