export default function FormMessage({ variant = 'error', className, children }) {
  if (!children) return null
  return (
    <p
      className={className || (variant === 'success' ? 'field-hint settings-success' : 'auth-error')}
      role={variant === 'success' ? 'status' : 'alert'}
    >
      {children}
    </p>
  )
}
