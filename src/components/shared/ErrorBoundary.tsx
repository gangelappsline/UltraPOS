import { Component, type ReactNode } from "react";
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <div className="empty" style={{ minHeight: "100vh" }}>
          <h1>No pudimos mostrar esta pantalla</h1>
          <p>
            Recarga la aplicación. Si el problema continúa, revisa la conexión y
            el contrato de la API.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Volver a intentar
          </button>
          <a href="/auth/login">Ir a inicio de sesión</a>
        </div>
      );
    return this.props.children;
  }
}
