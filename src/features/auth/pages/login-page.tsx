import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { LoginForm } from '../components/login-form';

export const LoginPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If user is already authenticated, redirect to previous path or home
  useEffect(() => {
    if (!isLoading && user) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, isLoading, navigate, location]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-md">
        <LoginForm
          onSuccess={() => {
            const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
            navigate(from, { replace: true });
          }}
        />
      </div>
      <div className="mt-8 text-center text-xs text-slate-400">
        Hệ Thống Quản Lý Sản Xuất &bull; ITS-QLSX
      </div>
    </div>
  );
};
