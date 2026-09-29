import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/features/auth/context/auth-context';
import { AppRoutes } from '@/routes';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
