// Create ErrorBoundary.js component
import React from "react";

class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return <div className="p-4 text-red-500">Component failed to render</div>;
    }
    return this.props.children;
  }
}
export default ErrorBoundary;
