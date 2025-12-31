import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-content">
          <h1 className="login-title">trello cop</h1>
          <p className="login-subtitle">Connectez-vous à votre compte</p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <Label htmlFor="email" className="form-label">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <Label htmlFor="password" className="form-label">Password</Label>
              <div className="password-input-wrapper">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="form-input"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="form-button"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className="login-footer">
            <p className="footer-text">
              Don't have an account?{' '}
              <Link to="/signup" className="signup-link">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%);
          padding: 1rem;
        }

        .login-card {
          background: hsl(var(--background));
          border-radius: calc(var(--radius) + 4px);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 400px;
          overflow: hidden;
        }

        .login-content {
          padding: 2.5rem;
        }

        .login-title {
          font-size: 1.875rem;
          font-weight: 700;
          color: hsl(var(--foreground));
          margin-bottom: 0.5rem;
          text-align: center;
        }

        .login-subtitle {
          font-size: 0.875rem;
          color: hsl(var(--muted-foreground));
          text-align: center;
          margin-bottom: 2rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: hsl(var(--foreground));
        }

        .form-input {
          padding: 0.625rem 0.875rem;
          border: 1px solid hsl(var(--border));
          border-radius: calc(var(--radius) - 2px);
          font-size: 0.875rem;
          background: hsl(var(--background));
          color: hsl(var(--foreground));
        }

        .form-input:focus {
          outline: none;
          border-color: hsl(var(--primary));
          box-shadow: 0 0 0 3px hsla(var(--primary), 0.1);
        }

        .form-button {
          width: 100%;
          padding: 0.75rem;
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border: none;
          border-radius: calc(var(--radius) - 2px);
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .form-button:hover:not(:disabled) {
          background: hsl(var(--primary) / 0.9);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px hsla(var(--primary), 0.4);
        }

        .form-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-footer {
          margin-top: 1.5rem;
          text-align: center;
        }

        .footer-text {
          font-size: 0.875rem;
          color: hsl(var(--muted-foreground));
        }

        .signup-link {
          color: hsl(var(--primary));
          text-decoration: none;
          font-weight: 600;
          transition: color 0.3s ease;
        }

        .signup-link:hover {
          color: hsl(var(--primary) / 0.8);
          text-decoration: underline;
        }

        .password-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .password-toggle-btn {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: hsl(var(--muted-foreground));
          padding: 0.25rem;
          transition: color 0.2s ease;
        }

        .password-toggle-btn:hover {
          color: hsl(var(--foreground));
        }

        .form-input:has(+ .password-toggle-btn) {
          padding-right: 2.5rem;
        }

        @media (max-width: 640px) {
          .login-content {
            padding: 2rem;
          }

          .login-title {
            font-size: 1.5rem;
          }

          .login-form {
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
