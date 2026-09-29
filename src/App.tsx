import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/context/auth-context';
import { ThemeProvider } from '@/components/theme';
import { ToastProvider, LoadingProvider } from '@/components/feedback';
import { AppRoutes } from '@/routes';

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LoadingProvider>
          <ToastProvider>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </ToastProvider>
        </LoadingProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
