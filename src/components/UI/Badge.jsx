const variantClasses = {
  default: '',
  'priority-high': 'badge-priority-high',
  'priority-medium': 'badge-priority-medium',
  'priority-low': 'badge-priority-low',
  success: 'badge-success',
  info: 'badge-info',
};

export default function Badge({
  children,
  variant = 'default',
  className = '',
}) {
  const classes = [
    'badge',
    variantClasses[variant] || '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <span className={classes}>{children}</span>;
}
