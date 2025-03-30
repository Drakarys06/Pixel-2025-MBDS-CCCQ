import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ThemeToggle from '../ui/ThemeToggle';
import { useAuth } from '../auth/AuthContext';
import authService from '../../services/authService';
import '../../styles/pages/LoginPage.css';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, loginAsGuest, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the page they were trying to access (if any)
  const from = location.state?.from?.pathname || '/';

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate(from, { replace: true });
    }
  }, [isLoggedIn, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Use authService instead of direct fetch
      const data = await authService.login(email, password);

      // Login successful - update auth context
      login(data.token, data.userId, data.username, data.roles || [], data.permissions || []);
      
      // Redirect to the page they were trying to access, or home page
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  // Guest login function
  const handleGuestLogin = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      await loginAsGuest();
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Guest login error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during guest login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Navbar-like top section */}
      <header className="login-top-header">
        <Link to="/" className="login-home-link">PixelBoard</Link>
        <ThemeToggle />
      </header>

      <div className="login-frame">
        <div className="login-frame-header">
          <h1 className="login-logo">PixelBoard</h1>
        </div>
        
        <div className="login-form-container">
          <h2>Sign in to PixelBoard</h2>
          
          {error && <div className="login-error">{error}</div>}
          
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>
            
            <button 
              type="submit" 
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          
          <div className="login-guest">
            <p>or</p>
            <button 
              onClick={handleGuestLogin}
              className="guest-button"
              disabled={isLoading}
            >
              Continue as guest
            </button>
          </div>
          
          <div className="login-footer">
            <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;