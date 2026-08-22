import React from 'react';

const Select = React.forwardRef(({
  label,
  options,
  error,
  className = '',
  disabled = false,
  required = false,
  placeholder,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-danger-500">*</span>}
        </label>
      )}
      <select
        ref={ref}
        disabled={disabled}
        className={`
          block w-full rounded-md sm:text-sm py-2 pl-3 pr-10
          ${error
            ? 'border-danger-300 text-danger-900 focus:border-danger-500 focus:ring-danger-500'
            : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
          }
          border outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-500
          ${className}
        `}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-danger-600">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;
