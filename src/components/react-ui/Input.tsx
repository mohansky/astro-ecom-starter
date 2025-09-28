import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  helperText,
  className,
  containerClassName,
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={cn("form-control w-full", containerClassName)}>
      {label && (
        <label className="label" htmlFor={inputId}>
          <span className="label-text">{label}</span>
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'input input-bordered w-full',
          error && 'input-error',
          className
        )}
        {...props}
      />
      {(error || helperText) && (
        <label className="label">
          <span className={cn(
            'label-text-alt',
            error ? 'text-error' : 'text-base-content/70'
          )}>
            {error || helperText}
          </span>
        </label>
      )}
    </div>
  );
}

export default Input;