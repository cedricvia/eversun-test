import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center',
          backgroundColor: '#fff5f5',
          border: '1px solid #fed7d7',
          borderRadius: '8px',
          margin: '20px',
          color: '#c53030'
        }}>
          <h2>⚠️ Une erreur critique est survenue</h2>
          <p>L'application a rencontré une erreur et ne peut pas continuer.</p>
          
          <details style={{ marginTop: '20px', textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              📋 Détails techniques de l'erreur
            </summary>
            <div style={{ marginTop: '10px' }}>
              <h4>Erreur:</h4>
              <pre style={{ 
                backgroundColor: '#f7fafc', 
                padding: '10px', 
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '12px',
                marginBottom: '10px'
              }}>
                {this.state.error?.toString()}
              </pre>
              
              <h4>Stack Trace:</h4>
              <pre style={{ 
                backgroundColor: '#f7fafc', 
                padding: '10px', 
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '11px',
                maxHeight: '200px'
              }}>
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>
          </details>
          
          <div style={{ marginTop: '20px' }}>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#e53e3e',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              🔄 Recharger la page
            </button>
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#805ad5',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🗑️ Vider le cache et recharger
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
)
