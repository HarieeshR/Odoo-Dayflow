import React, { useState } from 'react';
import { initialsOf, profilePhotoUrl, personName } from '../../utils/media';

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-20 w-20 text-xl'
};

const Avatar = ({ person, name, src, size = 'md', className = '' }) => {
  const [failed, setFailed] = useState(false);
  const photo = src || profilePhotoUrl(person);
  const label = name || personName(person);
  const classes = `${sizeClasses[size] || sizeClasses.md} rounded-full flex items-center justify-center font-bold overflow-hidden shrink-0 ${className}`;

  if (photo && !failed) {
    return (
      <img
        src={photo}
        alt={label}
        className={`${classes} object-cover bg-primary-100`}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className={`${classes} bg-primary-100 text-primary-700`}>
      {initialsOf(person, label)}
    </div>
  );
};

export default Avatar;
