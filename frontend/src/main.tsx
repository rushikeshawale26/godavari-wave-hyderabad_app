import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './context/ThemeContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4500,
          className: 'site-toast',
          success: { duration: 4000, iconTheme: { primary: '#26744a', secondary: '#fff' } },
          error: { duration: 5500, iconTheme: { primary: '#bd4c45', secondary: '#fff' } },
        }}
      />
    </ThemeProvider>
  </StrictMode>,
)
