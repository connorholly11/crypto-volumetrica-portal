import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ErrorAlertProps {
  title?: string
  error: Error | unknown
  className?: string
}

export function ErrorAlert({ title = 'Error', error, className }: ErrorAlertProps) {
  // Extract error message
  let errorMessage = 'An unexpected error occurred'
  
  if (error instanceof Error) {
    errorMessage = error.message
  } else if (typeof error === 'string') {
    errorMessage = error
  } else if (error && typeof error === 'object' && 'message' in error) {
    errorMessage = String(error.message)
  }

  // Check if it's an API error with additional details
  const isApiError = error instanceof Error && error.message.includes('API')
  
  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">
        <p>{errorMessage}</p>
        {isApiError && (
          <p className="mt-2 text-sm opacity-75">
            Please check your connection and try again. If the problem persists, contact support.
          </p>
        )}
      </AlertDescription>
    </Alert>
  )
}

// Compact version for inline errors
export function ErrorMessage({ error, className }: { error: Error | unknown; className?: string }) {
  let errorMessage = 'An error occurred'
  
  if (error instanceof Error) {
    errorMessage = error.message
  } else if (typeof error === 'string') {
    errorMessage = error
  }
  
  return (
    <div className={`flex items-center gap-2 text-sm text-destructive ${className}`}>
      <AlertCircle className="h-4 w-4" />
      <span>{errorMessage}</span>
    </div>
  )
}