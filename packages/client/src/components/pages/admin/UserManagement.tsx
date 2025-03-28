import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../../layout/Layout';
import { usePermission } from '../../auth/AuthContext';
import { PERMISSIONS } from '../../../constants/permissions';
import '../../../styles/pages/admin/UserManagement.css';

interface IRole {
  _id: string;
  name: string;
  description: string;
}

interface IUser {
  _id: string;
  username: string;
  email: string;
  pixelsPlaced: number;
  boardsCreated: number;
  roles: IRole[];
  createdAt: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<IUser[]>([]);
  const [roles, setRoles] = useState<IRole[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const canViewUsers = usePermission(PERMISSIONS.USER_VIEW);
  const canUpdateUsers = usePermission(PERMISSIONS.USER_UPDATE);
  const canDeleteUsers = usePermission(PERMISSIONS.USER_DELETE);
  const canManageRoles = usePermission(PERMISSIONS.ROLE_MANAGE);
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  
  // Récupérer les utilisateurs et les rôles
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Récupérer les utilisateurs
        const usersResponse = await axios.get<IUser[]>(`${API_URL}/api/admin/users`);
        setUsers(usersResponse.data);
        
        // Récupérer les rôles
        const rolesResponse = await axios.get<IRole[]>(`${API_URL}/api/admin/roles`);
        setRoles(rolesResponse.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [API_URL]);
  
  // Sélectionner un utilisateur pour l'édition
  const handleSelectUser = (user: IUser) => {
    setCurrentUser({...user});
    setFormError(null);
  };
  
  // Mettre à jour les rôles d'un utilisateur
  const handleToggleRole = async (userId: string, roleId: string, hasRole: boolean) => {
    try {
      if (hasRole) {
        // Retirer le rôle
        await axios.delete(`${API_URL}/api/admin/users/${userId}/roles/${roleId}`);
      } else {
        // Ajouter le rôle
        await axios.post(`${API_URL}/api/admin/users/${userId}/roles/${roleId}`);
      }
      
      // Recharger les utilisateurs
      const response = await axios.get<IUser[]>(`${API_URL}/api/admin/users`);
      setUsers(response.data as IUser[]);
      
      // Mettre à jour l'utilisateur courant si nécessaire
      if (currentUser && currentUser._id === userId) {
        const updatedUser = response.data.find((u: IUser) => u._id === userId);
        if (updatedUser) {
          setCurrentUser(updatedUser);
        }
      }
      
      setSuccessMessage('Rôles mis à jour avec succès');
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Erreur lors de la mise à jour des rôles');
      console.error('Error updating roles:', err);
    }
  };
  
  // Supprimer un utilisateur
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
      return;
    }
    
    try {
      await axios.delete(`${API_URL}/api/admin/users/${userId}`);
      
      // Recharger les utilisateurs
      const response = await axios.get(`${API_URL}/api/admin/users`);
      setUsers(response.data as IUser[]);
      
      // Réinitialiser l'utilisateur courant si nécessaire
      if (currentUser && currentUser._id === userId) {
        setCurrentUser(null);
      }
      
      setSuccessMessage('Utilisateur supprimé avec succès');
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression de l\'utilisateur');
      console.error('Error deleting user:', err);
    }
  };
  
  // Formater la date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Si l'utilisateur n'a pas la permission de voir les utilisateurs
  if (!canViewUsers) {
    return (
      <Layout>
        <div className="user-management unauthorized">
          <h1>Gestion des utilisateurs</h1>
          <p>Vous n'avez pas les permissions nécessaires pour voir les utilisateurs.</p>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="user-management">
        <h1>Gestion des utilisateurs</h1>
        
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="alert alert-success">
            {successMessage}
          </div>
        )}
        
        <div className="user-management-container">
          <div className="user-list-container">
            <div className="user-list-header">
              <h2>Utilisateurs</h2>
            </div>
            
            {loading ? (
              <div className="loading">Chargement des utilisateurs...</div>
            ) : users.length === 0 ? (
              <div className="no-users">Aucun utilisateur disponible</div>
            ) : (
              <div className="user-list">
                <table>
                  <thead>
                    <tr>
                      <th>Nom d'utilisateur</th>
                      <th>Email</th>
                      <th>Date de création</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr 
                        key={user._id} 
                        className={currentUser?._id === user._id ? 'selected' : ''}
                        onClick={() => handleSelectUser(user)}
                      >
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td>
                          <div className="user-actions">
                            <button 
                              className="btn-view"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectUser(user);
                              }}
                              title="Voir les détails"
                            >
                              👁️
                            </button>
                            
                            {canDeleteUsers && (
                              <button 
                                className="btn-delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteUser(user._id);
                                }}
                                title="Supprimer"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {currentUser && (
            <div className="user-details-container">
              <h2>Détails de l'utilisateur</h2>
              
              {formError && (
                <div className="alert alert-error">
                  {formError}
                </div>
              )}
              
              <div className="user-info">
                <div className="info-group">
                  <label>Nom d'utilisateur:</label>
                  <span>{currentUser.username}</span>
                </div>
                
                <div className="info-group">
                  <label>Email:</label>
                  <span>{currentUser.email}</span>
                </div>
                
                <div className="info-group">
                  <label>Pixels placés:</label>
                  <span>{currentUser.pixelsPlaced}</span>
                </div>
                
                <div className="info-group">
                  <label>Tableaux créés:</label>
                  <span>{currentUser.boardsCreated}</span>
                </div>
                
                <div className="info-group">
                  <label>Date de création:</label>
                  <span>{formatDate(currentUser.createdAt)}</span>
                </div>
              </div>
              
              {canUpdateUsers && canManageRoles && (
                <div className="user-roles">
                  <h3>Rôles</h3>
                  
                  <table className="roles-table">
                    <thead>
                      <tr>
                        <th>Rôle</th>
                        <th>Description</th>
                        <th>Assigné</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roles.map(role => {
                        const hasRole = currentUser.roles.some(r => r._id === role._id);
                        return (
                          <tr key={role._id}>
                            <td>{role.name}</td>
                            <td>{role.description}</td>
                            <td>
                              <label className="toggle-switch">
                                <input
                                  type="checkbox"
                                  checked={hasRole}
                                  onChange={() => handleToggleRole(currentUser._id, role._id, hasRole)}
                                />
                                <span className="toggle-slider"></span>
                              </label>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default UserManagement;