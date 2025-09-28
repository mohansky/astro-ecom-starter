import React from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Textarea({
  label,
  error,
  helperText,
  className,
  id,
  ...props
}: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="form-control w-full">
      {label && (
        <label className="label" htmlFor={textareaId}>
          <span className="label-text">{label}</span>
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          'textarea textarea-bordered w-full',
          error && 'textarea-error',
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

export default Textarea;