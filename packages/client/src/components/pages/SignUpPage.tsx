import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../ui/ThemeToggle';
import { useAuth } from '../auth/AuthContext';
import '../../styles/pages/LoginPage.css';

const SignupPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      console.log('Signup response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l\'inscription');
      }

      // Check that these properties exist in the response
      if (!data.token || !data.userId || !data.username) {
        console.error('Missing required data in response:', data);
        throw new Error('Réponse du serveur incomplète');
      }

      // Registration successful - log the user in
      // Extraire les rôles et permissions de la réponse ou utiliser des valeurs par défaut
      const roles = data.roles || ['user'];
      const permissions = data.permissions || [];
      
      login(data.token, data.userId, data.username, roles, permissions);
      
      // Redirect to home page
      navigate('/');
    } catch (err) {
      console.error('Erreur d\'inscription:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de l\'inscription');
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
          <h2>Créer un compte</h2>
          
          {error && <div className="login-error">{error}</div>}
          
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Nom d'utilisateur</label>
              <input 
                type="text" 
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Choisissez un nom d'utilisateur"
                minLength={3}
                maxLength={20}
              />
            </div>
            
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
                placeholder="Créez un mot de passe"
                minLength={6}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
              <input 
                type="password" 
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirmez votre mot de passe"
                minLength={6}
              />
            </div>
            
            <button 
              type="submit" 
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? 'Création en cours...' : 'Créer un compte'}
            </button>
          </form>
          
          <div className="login-footer">
            <p>Vous avez déjà un compte? <Link to="/login">Se connecter</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;