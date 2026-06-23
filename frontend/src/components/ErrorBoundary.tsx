import { Component, type ReactNode } from "react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex items-center justify-center h-screen bg-background">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                No se puede conectar con el backend.
              </p>
              <p className="text-xs text-muted-foreground">
                Asegurate de estar accediendo desde la aplicación nativa o por{" "}
                <code className="text-primary">http://localhost:34115</code>
              </p>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}
