import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../../layout/Layout';
import { usePermission } from '../../auth/AuthContext';
import { PERMISSIONS } from '../../../constants/permissions';
import '../../../styles/pages/admin/RoleManagement.css';

interface IRole {
  _id: string;
  name: string;
  description: string;
  permissions: string[];
  isDefault: boolean;
}

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<IRole[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<IRole | null>(null);
  const [allPermissions, setAllPermissions] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const canManageRoles = usePermission(PERMISSIONS.ROLE_MANAGE);
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  
  // Récupérer les rôles et les permissions disponibles
  useEffect(() => {
    const fetchRoles = async () => {
      setLoading(true);
      try {
        // Récupérer les rôles
        const rolesResponse = await axios.get<IRole[]>(`${API_URL}/api/admin/roles`);
        setRoles(rolesResponse.data);
        
        // Récupérer les permissions disponibles
        const permissionsResponse = await axios.get(`${API_URL}/api/init-roles`);
        const data = permissionsResponse.data as { availablePermissions?: Record<string, string> };
        if (data.availablePermissions) {
          setAllPermissions(Object.values(data.availablePermissions));
        }
      } catch (err) {
        setError('Erreur lors du chargement des rôles');
        console.error('Error fetching roles:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRoles();
  }, [API_URL]);
  
  // Sélectionner un rôle pour l'édition
  const handleSelectRole = (role: IRole) => {
    setCurrentRole({...role});
    setIsEditing(true);
    setIsCreating(false);
    setFormError(null);
  };
  
  // Mettre à jour le rôle sélectionné
  const handleRoleChange = (field: keyof IRole, value: any) => {
    if (!currentRole) return;
    
    setCurrentRole({
      ...currentRole,
      [field]: value
    });
  };
  
  // Gérer les changements de permissions
  const handlePermissionToggle = (permission: string) => {
    if (!currentRole) return;
    
    const updatedPermissions = currentRole.permissions.includes(permission)
      ? currentRole.permissions.filter(p => p !== permission)
      : [...currentRole.permissions, permission];
    
    setCurrentRole({
      ...currentRole,
      permissions: updatedPermissions
    });
  };
  
  // Initialiser un nouveau rôle
  const handleCreateNewRole = () => {
    setCurrentRole({
      _id: '',
      name: '',
      description: '',
      permissions: [],
      isDefault: false
    });
    setIsCreating(true);
    setIsEditing(false);
    setFormError(null);
  };
  
  // Sauvegarder le rôle (créer ou mettre à jour)
  const handleSaveRole = async () => {
    if (!currentRole) return;
    
    // Validation
    if (!currentRole.name || !currentRole.description) {
      setFormError('Le nom et la description sont requis');
      return;
    }
    
    if (currentRole.permissions.length === 0) {
      setFormError('Sélectionnez au moins une permission');
      return;
    }
    
    setFormError(null);
    
    try {
      if (isCreating) {
        // Créer un nouveau rôle
        const { _id, ...roleData } = currentRole;
        await axios.post(`${API_URL}/api/admin/roles`, roleData);
        setSuccessMessage('Rôle créé avec succès');
      } else if (isEditing) {
        // Mettre à jour un rôle existant
        await axios.put(`${API_URL}/api/admin/roles/${currentRole._id}`, currentRole);
        setSuccessMessage('Rôle mis à jour avec succès');
      }
      
      // Recharger les rôles
      const response = await axios.get(`${API_URL}/api/admin/roles`);
      setRoles(response.data as IRole[]);
      
      // Réinitialiser l'état
      setIsCreating(false);
      setIsEditing(false);
      setCurrentRole(null);
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Erreur lors de la sauvegarde du rôle');
      console.error('Error saving role:', err);
    }
  };
  
  // Supprimer un rôle
  const handleDeleteRole = async (roleId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce rôle ? Cette action est irréversible.')) {
      return;
    }
    
    try {
      await axios.delete(`${API_URL}/api/admin/roles/${roleId}`);
      
      // Recharger les rôles
      const response = await axios.get(`${API_URL}/api/admin/roles`);
      setRoles(response.data as IRole[]);
      
      // Réinitialiser l'état si le rôle supprimé était sélectionné
      if (currentRole && currentRole._id === roleId) {
        setCurrentRole(null);
        setIsEditing(false);
      }
      
      setSuccessMessage('Rôle supprimé avec succès');
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression du rôle');
      console.error('Error deleting role:', err);
    }
  };
  
  // Annuler l'édition ou la création
  const handleCancel = () => {
    setCurrentRole(null);
    setIsEditing(false);
    setIsCreating(false);
    setFormError(null);
  };
  
  // Si l'utilisateur n'a pas la permission de gérer les rôles
  if (!canManageRoles) {
    return (
      <Layout>
        <div className="role-management unauthorized">
          <h1>Gestion des rôles</h1>
          <p>Vous n'avez pas les permissions nécessaires pour gérer les rôles.</p>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="role-management">
        <h1>Gestion des rôles</h1>
        
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
        
        <div className="role-management-container">
          <div className="role-list-container">
            <div className="role-list-header">
              <h2>Rôles disponibles</h2>
              <button 
                className="btn-create"
                onClick={handleCreateNewRole}
                disabled={loading}
              >
                Créer un rôle
              </button>
            </div>
            
            {loading ? (
              <div className="loading">Chargement des rôles...</div>
            ) : roles.length === 0 ? (
              <div className="no-roles">Aucun rôle disponible</div>
            ) : (
              <ul className="role-list">
                {roles.map(role => (
                  <li 
                    key={role._id}
                    className={`role-item ${currentRole?._id === role._id ? 'selected' : ''}`}
                  >
                    <div 
                      className="role-info"
                      onClick={() => handleSelectRole(role)}
                    >
                      <div className="role-name">
                        {role.name}
                        {role.isDefault && <span className="badge default-badge">Par défaut</span>}
                      </div>
                      <div className="role-description">{role.description}</div>
                      <div className="role-permissions-count">
                        {role.permissions.length} permission{role.permissions.length > 1 ? 's' : ''}
                      </div>
                    </div>
                    <button 
                      className="btn-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRole(role._id);
                      }}
                      title="Supprimer"
                    >
                      &times;
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {(isEditing || isCreating) && currentRole && (
            <div className="role-edit-container">
              <h2>{isCreating ? 'Créer un rôle' : 'Modifier le rôle'}</h2>
              
              {formError && (
                <div className="alert alert-error">
                  {formError}
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="roleName">Nom</label>
                <input
                  type="text"
                  id="roleName"
                  value={currentRole.name}
                  onChange={(e) => handleRoleChange('name', e.target.value)}
                  placeholder="Nom du rôle"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="roleDescription">Description</label>
                <textarea
                  id="roleDescription"
                  value={currentRole.description}
                  onChange={(e) => handleRoleChange('description', e.target.value)}
                  placeholder="Description du rôle"
                  rows={3}
                />
              </div>
              
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={currentRole.isDefault}
                    onChange={(e) => handleRoleChange('isDefault', e.target.checked)}
                  />
                  Rôle par défaut pour les nouveaux utilisateurs
                </label>
              </div>
              
              <div className="form-group">
                <label>Permissions</label>
                <div className="permissions-list">
                  {allPermissions.map(permission => (
                    <div key={permission} className="permission-item">
                      <label>
                        <input
                          type="checkbox"
                          checked={currentRole.permissions.includes(permission)}
                          onChange={() => handlePermissionToggle(permission)}
                        />
                        {permission}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  className="btn-save"
                  onClick={handleSaveRole}
                >
                  Enregistrer
                </button>
                <button 
                  className="btn-cancel"
                  onClick={handleCancel}
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default RoleManagement;