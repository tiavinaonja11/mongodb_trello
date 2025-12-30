import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const SignupPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await signup(email, password, fullName);
      toast.success('Account created! Please login.');
      navigate('/login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-content">
          <h1 className="signup-title">trello cop</h1>
          <p className="signup-subtitle">Créez votre compte</p>

          <form onSubmit={handleSubmit} className="signup-form">
            <div className="form-group">
              <Label htmlFor="fullName" className="form-label">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="form-input"
              />
            </div>

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
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <Label htmlFor="confirmPassword" className="form-label">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="form-button"
            >
              {isLoading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </form>

          <div className="signup-footer">
            <p className="footer-text">
              Already have an account?{' '}
              <Link to="/login" className="login-link">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .signup-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%);
          padding: 1rem;
        }

        .signup-card {
          background: hsl(var(--background));
          border-radius: calc(var(--radius) + 4px);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 400px;
          overflow: hidden;
        }

        .signup-content {
          padding: 2.5rem;
        }

        .signup-title {
          font-size: 1.875rem;
          font-weight: 700;
          color: hsl(var(--foreground));
          margin-bottom: 0.5rem;
          text-align: center;
        }

        .signup-subtitle {
          font-size: 0.875rem;
          color: hsl(var(--muted-foreground));
          text-align: center;
          margin-bottom: 2rem;
        }

        .signup-form {
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

        .signup-footer {
          margin-top: 1.5rem;
          text-align: center;
        }

        .footer-text {
          font-size: 0.875rem;
          color: hsl(var(--muted-foreground));
        }

        .login-link {
          color: hsl(var(--primary));
          text-decoration: none;
          font-weight: 600;
          transition: color 0.3s ease;
        }

        .login-link:hover {
          color: hsl(var(--primary) / 0.8);
          text-decoration: underline;
        }

        @media (max-width: 640px) {
          .signup-content {
            padding: 2rem;
          }

          .signup-title {
            font-size: 1.5rem;
          }

          .signup-form {
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default SignupPage;
