import React from 'react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Checkbox({
  label,
  error,
  helperText,
  className,
  id,
  ...props
}: CheckboxProps) {
  const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="form-control">
      <label className="label cursor-pointer justify-start gap-3" htmlFor={checkboxId}>
        <input
          type="checkbox"
          id={checkboxId}
          className={cn(
            'checkbox',
            error && 'checkbox-error',
            className
          )}
          {...props}
        />
        {label && <span className="label-text">{label}</span>}
      </label>
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

export default Checkbox;