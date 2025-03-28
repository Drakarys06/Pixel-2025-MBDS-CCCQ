import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Layout from '../layout/Layout';
import '../../styles/pages/Profile.css';

const ProfilePage: React.FC = () => {
  const { currentUser, logout, isGuestMode } = useAuth();
  
  // Si l'utilisateur est en mode invité, afficher un message spécial
  if (isGuestMode) {
    return (
      <Layout>
        <div className="profile-container">
          <div className="profile-content">
            <div className="profile-card">
              <h1 className="profile-title">Profil non disponible</h1>
              
              <div className="profile-info">
                <p>Vous êtes en mode visiteur. Pour accéder à votre profil, veuillez créer un compte.</p>
                
                <div className="profile-actions">
                  <Link to="/signup" className="btn-primary">Créer un compte</Link>
                  <Link to="/" className="btn-secondary">Retour à l'accueil</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="profile-content">
        <div className="profile-card">
          <h1 className="profile-title">Votre profil</h1>
          
          <div className="profile-info">
            <div className="info-group">
              <label>Nom d'utilisateur:</label>
              <span>{currentUser?.username}</span>
            </div>
            
            <div className="info-group">
              <label>Rôles:</label>
              <span>{currentUser?.roles.join(', ')}</span>
            </div>
            
            <div className="info-group">
              <label>Permissions:</label>
              <span>{currentUser?.permissions.join(', ')}</span>
            </div>
            
            <div className="profile-actions">
              <button className="btn-primary" onClick={logout}>Déconnexion</button>
              <Link to="/boards" className="btn-secondary">Mes tableaux</Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;