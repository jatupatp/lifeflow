import { Loader2 } from 'lucide-react';

const variantClasses = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
};

const sizeClasses = {
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  children,
  className = '',
  disabled,
  ...rest
}) {
  const classes = [
    'btn',
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.md,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 14 : 18} className="animate-spin" />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 14 : 18} />
      ) : null}
      {children}
    </button>
  );
}
