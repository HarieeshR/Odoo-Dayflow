import React from 'react';
import { HiOutlineInbox } from 'react-icons/hi';

const EmptyState = ({
  icon: Icon = HiOutlineInbox,
  title,
  message,
  description,
  actionButton,
  className = ''
}) => {
  const heading = title || message || 'Nothing here yet';
  const detail = description || (!title ? undefined : message);
  return (
    <div className={`text-center py-12 ${className}`}>
      <Icon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">{heading}</h3>
      {detail && <p className="mt-1 text-sm text-gray-500">{detail}</p>}
      {actionButton && <div className="mt-6">{actionButton}</div>}
    </div>
  );
};

export default EmptyState;
