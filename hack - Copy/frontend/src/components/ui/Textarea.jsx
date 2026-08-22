import React from 'react';

const Textarea = React.forwardRef(({
  label,
  error,
  className = '',
  disabled = false,
  required = false,
  rows = 4,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-danger-500">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        disabled={disabled}
        className={`
          block w-full rounded-md sm:text-sm px-3 py-2
          ${error
            ? 'border-danger-300 text-danger-900 placeholder-danger-300 focus:border-danger-500 focus:ring-danger-500'
            : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
          }
          border outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-500 resize-y
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-danger-600">{error}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';
export default Textarea;
