import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { completeNewPassword, clearError } from '../../store/slices/authSlice';
import './NewPasswordPage.scss';

export const NewPasswordPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error, pendingEmail } = useAppSelector((state) => state.auth);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    setValidationError('');

    if (newPassword !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return;
    }

    const result = await dispatch(completeNewPassword({ newPassword }));

    if (completeNewPassword.fulfilled.match(result)) {
      navigate('/');
    }
  };

  return (
    <div className="new-password-page">
      <div className="new-password-page__container">
        <div className="new-password-page__header">
          <div className="new-password-page__logo">
            <Lock size={32} />
          </div>
          <h1 className="new-password-page__title">Set New Password</h1>
          <p className="new-password-page__subtitle">
            {pendingEmail ? `Please set a new password for ${pendingEmail}` : 'Please set a new password to continue'}
          </p>
        </div>

        <form className="new-password-page__form" onSubmit={handleSubmit}>
          {(error || validationError) && (
            <div className="new-password-page__error">{error || validationError}</div>
          )}

          <div className="new-password-page__field">
            <label htmlFor="newPassword" className="new-password-page__label">New Password</label>
            <input
              id="newPassword"
              type="password"
              className="new-password-page__input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
              minLength={8}
            />
          </div>

          <div className="new-password-page__field">
            <label htmlFor="confirmPassword" className="new-password-page__label">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              className="new-password-page__input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />
          </div>

          <button
            type="submit"
            className="new-password-page__submit"
            disabled={isLoading}
          >
            {isLoading ? 'Setting password...' : 'Set Password'}
          </button>
        </form>
      </div>
    </div>
  );
};
