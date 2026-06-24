import { Component, type ErrorInfo, type ReactNode } from 'react'
import { captureException } from '../telemetry'

interface ErrorBoundaryProps {
  readonly children: ReactNode
}

interface ErrorBoundaryState {
  readonly hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  readonly state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo): void {
    captureException(error)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return <div role="alert">Something went wrong. Restart Yawab and try again.</div>
    }

    return this.props.children
  }
}
