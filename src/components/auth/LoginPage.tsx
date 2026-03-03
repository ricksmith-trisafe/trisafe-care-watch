import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { login, clearError } from '../../store/slices/authSlice';
import './LoginPage.scss';

export const LoginPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    dispatch(clearError());

    const result = await dispatch(login({ email, password }));

    if (login.fulfilled.match(result)) {
      if (result.payload.requiresNewPassword) {
        navigate('/new-password');
      } else {
        navigate('/');
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__container">
        <div className="login-page__header">
          <div className="login-page__logo">
            <Phone size={32} />
          </div>
          <h1 className="login-page__title">CareWatch</h1>
          <p className="login-page__subtitle">Response Center Login</p>
        </div>

        <form className="login-page__form" onSubmit={handleSubmit}>
          {error && (
            <div className="login-page__error">{error}</div>
          )}

          <div className="login-page__field">
            <label htmlFor="email" className="login-page__label">Email</label>
            <input
              id="email"
              type="email"
              className="login-page__input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="login-page__field">
            <label htmlFor="password" className="login-page__label">Password</label>
            <input
              id="password"
              type="password"
              className="login-page__input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="login-page__submit"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
