import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ThemeToggle from '../ui/ThemeToggle';
import { useAuth } from '../auth/AuthContext';
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
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Échec de la connexion');
      }

      // Login successful - update auth context
      login(data.token, data.userId, data.username);
      
      // Redirect to the page they were trying to access, or home page
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Erreur de connexion:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de connexion en tant que visiteur
  const handleGuestLogin = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      await loginAsGuest();
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Erreur de connexion visiteur:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la connexion visiteur');
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
          <h2>Connectez-vous à PixelBoard</h2>
          
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
                placeholder="Entrez votre email"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <input 
                type="password" 
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Entrez votre mot de passe"
              />
            </div>
            
            <button 
              type="submit" 
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
          
          <div className="login-guest">
            <p>ou</p>
            <button 
              onClick={handleGuestLogin}
              className="guest-button"
              disabled={isLoading}
            >
              Continuer en tant que visiteur
            </button>
          </div>
          
          <div className="login-footer">
            <p>Vous n'avez pas de compte? <Link to="/signup">S'inscrire</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;