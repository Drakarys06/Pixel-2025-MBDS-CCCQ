import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Layout from '../../layout/Layout';
import { usePermission } from '../../auth/AuthContext';
import { PERMISSIONS } from '../../../constants/permissions';
import '../../../styles/pages/admin/AdminDashboard.css';

interface DashboardStats {
  userCount: number;
  roleCount: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const hasAdminAccess = usePermission(PERMISSIONS.ADMIN_ACCESS);
  const canManageUsers = usePermission(PERMISSIONS.USER_VIEW);
  const canManageRoles = usePermission(PERMISSIONS.ROLE_MANAGE);
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  
  useEffect(() => {
    const fetchDashboardStats = async () => {
      setLoading(true);
      try {
        const response = await axios.get<{ stats: DashboardStats }>(`${API_URL}/api/admin/dashboard`);
        setStats(response.data.stats);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Erreur lors du chargement des statistiques');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardStats();
  }, [API_URL]);
  
  if (!hasAdminAccess) {
    return (
      <Layout>
        <div className="admin-dashboard unauthorized">
          <h1>Panneau d'administration</h1>
          <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="admin-dashboard">
        <h1>Panneau d'administration</h1>
        
        {error && <div className="alert alert-error">{error}</div>}
        
        <div className="dashboard-stats">
          {loading ? (
            <div className="loading">Chargement des statistiques...</div>
          ) : stats ? (
            <>
              <div className="stat-card">
                <h3>Utilisateurs</h3>
                <div className="stat-value">{stats.userCount}</div>
              </div>
              
              <div className="stat-card">
                <h3>Rôles</h3>
                <div className="stat-value">{stats.roleCount}</div>
              </div>
            </>
          ) : (
            <div className="no-stats">Aucune statistique disponible</div>
          )}
        </div>
        
        <div className="admin-modules">
          {canManageUsers && (
            <div className="admin-module-card">
              <h2>Gestion des utilisateurs</h2>
              <p>Gérer les utilisateurs, leurs rôles et leurs permissions.</p>
              <Link to="/admin/users" className="module-link">
                Accéder
              </Link>
            </div>
          )}
          
          {canManageRoles && (
            <div className="admin-module-card">
              <h2>Gestion des rôles</h2>
              <p>Créer, modifier et supprimer des rôles et leurs permissions.</p>
              <Link to="/admin/roles" className="module-link">
                Accéder
              </Link>
            </div>
          )}
        </div>
        
        <div className="admin-actions">
          <h2>Actions rapides</h2>
          
          <div className="action-buttons">
            <button className="action-button" onClick={() => window.location.reload()}>
              Rafraîchir les statistiques
            </button>
            
            <Link to="/" className="action-button secondary">
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;