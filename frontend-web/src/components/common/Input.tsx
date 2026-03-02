import React from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  register?: UseFormRegisterReturn;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, register, icon, leftIcon, rightIcon, helperText, id, ...props }, ref) => {
    const inputId = id || props.name || `input-${Math.random()}`;
    const finalLeftIcon = icon || leftIcon;

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-dark-700">
            {label}
          </label>
        )}
        <div className="relative">
          {finalLeftIcon && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dark-400">
              {finalLeftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`
              w-full px-4 py-3 bg-white border rounded-xl transition-all duration-200
              ${finalLeftIcon ? 'pl-11' : ''}
              ${rightIcon ? 'pr-11' : ''}
              ${
                error
                  ? 'border-danger-500 focus:ring-2 focus:ring-danger-500 focus:border-transparent'
                  : 'border-dark-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent hover:border-dark-300'
              }
              ${className || ''}
            `}
            placeholder={props.placeholder}
            {...register}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-dark-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-sm text-danger-600">{error}</p>}
        {helperText && !error && <p className="text-sm text-dark-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

