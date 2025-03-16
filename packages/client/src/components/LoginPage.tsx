import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ThemeToggle from './ui/ThemeToggle';
import { useAuth } from './AuthContext';
import '../styles/LoginPage.css';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the page they were trying to access (if any)
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Vérifiez que ces propriétés existent bien dans la réponse
      if (!data.token || !data.userId || !data.username) {
        console.error('Missing required data in response:', data);
        throw new Error('Réponse du serveur incomplète');
      }

      // Login successful - update auth context and redirect
      login(data.token, data.userId, data.username);
      
      // Redirect to the page they were trying to access, or home page
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <header className="login-header">
        <Link to="/" className="login-logo">PixelBoard</Link>
        <ThemeToggle />
      </header>

      <div className="login-form-container">
        <h1>Log in to PixelBoard</h1>
        
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
            {isLoading ? 'Logging in...' : 'Log in'}
          </button>
          
          {/* Bouton de test pour débogage */}
          <button 
            type="button"
            style={{ marginTop: '10px' }}
            onClick={() => {
              const testToken = "test-token-123";
              const testUserId = "test-user-id";
              const testUsername = "Utilisateur Test";
              
              login(testToken, testUserId, testUsername);
              navigate('/');
              
              console.log('Test login executed');
            }}
          >
            Test Login (Debug)
          </button>
        </form>
        
        <div className="login-footer">
          <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;