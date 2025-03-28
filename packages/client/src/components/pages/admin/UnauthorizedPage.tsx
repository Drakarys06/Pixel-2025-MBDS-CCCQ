import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Layout from '../../layout/Layout';
import Button from '../../ui/Button';
import '../../../styles/pages/admin/UnauthorizedPage.css';

const UnauthorizedPage: React.FC = () => {
  const location = useLocation();
  const { requiredPermission, requiredRoles, from } = location.state || {};
  
  return (
    <Layout showNavbar={true}>
      <div className="unauthorized-container">
        <div className="unauthorized-content">
          <div className="unauthorized-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          
          <h1 className="unauthorized-title">Accès non autorisé</h1>
          
          <p className="unauthorized-message">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            {requiredPermission && (
              <span className="permission-info">
                Cette page nécessite la permission: <code>{requiredPermission}</code>
              </span>
            )}
            {requiredRoles && (
              <span className="role-info">
                Cette page nécessite l'un des rôles suivants: <code>{Array.isArray(requiredRoles) ? requiredRoles.join(', ') : requiredRoles}</code>
              </span>
            )}
          </p>
          
          <div className="unauthorized-actions">
            <Link to="/">
              <Button variant="primary">Retour à l'accueil</Button>
            </Link>
            
            {from && (
              <Link to="/login" state={{ from }}>
                <Button variant="secondary">Se connecter avec un autre compte</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UnauthorizedPage;