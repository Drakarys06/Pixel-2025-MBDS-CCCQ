import Role, { IRole } from '../models/Role';
import User, { IUser } from '../models/User';
import mongoose from 'mongoose';

// Liste des permissions disponibles dans l'application
export const PERMISSIONS = {
  // Permissions utilisateur
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  
  // Permissions de tableau
  BOARD_VIEW: 'board:view',
  BOARD_CREATE: 'board:create',
  BOARD_UPDATE: 'board:update',
  BOARD_DELETE: 'board:delete',
  
  // Permissions de pixel
  PIXEL_VIEW: 'pixel:view',
  PIXEL_CREATE: 'pixel:create',
  PIXEL_UPDATE: 'pixel:update',
  PIXEL_DELETE: 'pixel:delete',
  
  // Permissions administratives
  ADMIN_ACCESS: 'admin:access',
  ROLE_MANAGE: 'role:manage'
};

// Rôles prédéfinis avec leurs permissions
export const DEFAULT_ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user',
  GUEST: 'guest'
};

// Créer un nouveau rôle
export const createRole = async (roleData: Partial<IRole>): Promise<IRole> => {
  try {
    const role = new Role(roleData);
    await role.save();
    return role;
  } catch (error) {
    console.error('Error creating role:', error);
    throw error;
  }
};

// Obtenir tous les rôles
export const getAllRoles = async (): Promise<IRole[]> => {
  try {
    return await Role.find().sort({ name: 1 });
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
};

// Obtenir un rôle par son ID
export const getRoleById = async (id: string): Promise<IRole | null> => {
  try {
    return await Role.findById(id);
  } catch (error) {
    console.error('Error fetching role by ID:', error);
    throw error;
  }
};

// Obtenir un rôle par son nom
export const getRoleByName = async (name: string): Promise<IRole | null> => {
  try {
    return await Role.findOne({ name });
  } catch (error) {
    console.error('Error fetching role by name:', error);
    throw error;
  }
};

// Mettre à jour un rôle
export const updateRole = async (id: string, updates: Partial<IRole>): Promise<IRole | null> => {
  try {
    return await Role.findByIdAndUpdate(id, updates, { new: true });
  } catch (error) {
    console.error('Error updating role:', error);
    throw error;
  }
};

// Supprimer un rôle
export const deleteRole = async (id: string): Promise<IRole | null> => {
  try {
    // Supprimer le rôle des utilisateurs qui le possèdent
    await User.updateMany(
      { roles: id },
      { $pull: { roles: id } }
    );
    
    // Supprimer le rôle
    return await Role.findByIdAndDelete(id);
  } catch (error) {
    console.error('Error deleting role:', error);
    throw error;
  }
};

// Assigner un rôle à un utilisateur
export const assignRoleToUser = async (userId: string, roleId: string): Promise<IUser | null> => {
  try {
    return await User.findByIdAndUpdate(
      userId,
      { $addToSet: { roles: roleId } },
      { new: true }
    ).populate('roles');
  } catch (error) {
    console.error('Error assigning role to user:', error);
    throw error;
  }
};

// Retirer un rôle d'un utilisateur
export const removeRoleFromUser = async (userId: string, roleId: string): Promise<IUser | null> => {
  try {
    return await User.findByIdAndUpdate(
      userId,
      { $pull: { roles: roleId } },
      { new: true }
    ).populate('roles');
  } catch (error) {
    console.error('Error removing role from user:', error);
    throw error;
  }
};

// Obtenir les utilisateurs par rôle
export const getUsersByRole = async (roleId: string): Promise<IUser[]> => {
  try {
    return await User.find({ roles: roleId }).populate('roles');
  } catch (error) {
    console.error('Error fetching users by role:', error);
    throw error;
  }
};

// Initialiser les rôles par défaut
export const initializeDefaultRoles = async (): Promise<void> => {
  try {
    const existingRoles = await Role.countDocuments();
    
    if (existingRoles > 0) {
      console.log('Roles already initialized');
      return;
    }
    
    // Créer rôle Admin
    await createRole({
      name: DEFAULT_ROLES.ADMIN,
      description: 'Full access to all features',
      permissions: Object.values(PERMISSIONS),
      isDefault: false
    });
    
    // Créer rôle Moderator
    await createRole({
      name: DEFAULT_ROLES.MODERATOR,
      description: 'Can manage content but not users or settings',
      permissions: [
        PERMISSIONS.USER_VIEW,
        PERMISSIONS.BOARD_VIEW, PERMISSIONS.BOARD_CREATE, PERMISSIONS.BOARD_UPDATE, PERMISSIONS.BOARD_DELETE,
        PERMISSIONS.PIXEL_VIEW, PERMISSIONS.PIXEL_CREATE, PERMISSIONS.PIXEL_UPDATE, PERMISSIONS.PIXEL_DELETE
      ],
      isDefault: false
    });
    
    // Créer rôle User
    await createRole({
      name: DEFAULT_ROLES.USER,
      description: 'Regular authenticated user',
      permissions: [
        PERMISSIONS.USER_VIEW,
        PERMISSIONS.BOARD_VIEW, PERMISSIONS.BOARD_CREATE, PERMISSIONS.BOARD_UPDATE,
        PERMISSIONS.PIXEL_VIEW, PERMISSIONS.PIXEL_CREATE
      ],
      isDefault: true
    });
    
    // Créer rôle Guest
    await createRole({
      name: DEFAULT_ROLES.GUEST,
      description: 'Unauthenticated visitor',
      permissions: [
        PERMISSIONS.BOARD_VIEW,
        PERMISSIONS.PIXEL_VIEW,
        PERMISSIONS.PIXEL_CREATE
      ],
      isDefault: false
    });
    
    console.log('Default roles initialized');
  } catch (error) {
    console.error('Error initializing default roles:', error);
    throw error;
  }
};

// Assigner le rôle par défaut à un utilisateur
export const assignDefaultRoleToUser = async (userId: string): Promise<IUser | null> => {
  try {
    const defaultRole = await Role.findOne({ isDefault: true });
    
    if (!defaultRole) {
      console.warn('No default role found');
      return null;
    }
    
    return await assignRoleToUser(userId, defaultRole._id as string);
  } catch (error) {
    console.error('Error assigning default role to user:', error);
    throw error;
  }
};