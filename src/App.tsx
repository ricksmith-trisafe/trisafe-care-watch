import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { checkAuthState } from './store/slices/authSlice';
import { LoginPage, NewPasswordPage, ProtectedRoute } from './components/auth';
import { Dashboard } from './pages';
import './styles/global.scss';

function App() {
  const dispatch = useAppDispatch();
  const { isInitialized } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkAuthState());
  }, [dispatch]);

  if (!isInitialized) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading CareWatch...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/new-password" element={<NewPasswordPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
