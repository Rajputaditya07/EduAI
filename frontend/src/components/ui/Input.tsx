import React, { useState, useId } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  error?: string;
  size?: "sm" | "md";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, size = "md", id: propId, value, defaultValue, onFocus, onBlur, ...props }, ref) => {
    const generatedId = useId();
    const id = propId || generatedId;
    const [focused, setFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!value || !!defaultValue);

    const isFloating = focused || hasValue || !!value;

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      setHasValue(!!e.target.value);
      onBlur?.(e);
    };

    const heights = { sm: "h-10", md: "h-12" };

    return (
      <div className="relative">
        <input
          ref={ref}
          id={id}
          value={value}
          defaultValue={defaultValue}
          className={cn(
            "peer w-full rounded-lg border bg-surface px-3 pt-5 pb-1 text-sm text-foreground outline-none transition-colors",
            "placeholder-transparent",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            error ? "border-destructive focus:border-destructive focus:ring-destructive/20" : "border-border",
            heights[size],
            className
          )}
          placeholder={label}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
        <label
          htmlFor={id}
          className={cn(
            "absolute left-3 transition-all duration-200 pointer-events-none",
            isFloating
              ? "top-1.5 text-xs text-text-secondary"
              : "top-1/2 -translate-y-1/2 text-sm text-text-tertiary",
            error && "text-destructive"
          )}
        >
          {label}
        </label>
        {error && (
          <p id={`${id}-error`} className="mt-1 flex items-center gap-1 text-xs text-destructive" role="alert">
            <svg className="h-3 w-3 shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7 5a1 1 0 012 0v3a1 1 0 01-2 0V5zm1 7a1 1 0 100-2 1 1 0 000 2z" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
export type { InputProps };
