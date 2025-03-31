import express, { Request, Response } from 'express';
import { auth } from '../middleware/auth';
import { hasPermission, hasRole } from '../middleware/authorization';
import { PERMISSIONS, DEFAULT_ROLES } from '../services/roleService';
import * as roleService from '../services/roleService';
import User from '../models/User';
import Role from '../models/Role';

const router = express.Router();

// Middleware qui vérifie si l'utilisateur est administrateur
const isAdmin = hasRole(DEFAULT_ROLES.ADMIN);

// === Routes pour la gestion des utilisateurs ===

// Récupérer tous les utilisateurs
router.get('/users',
  auth,
  hasPermission(PERMISSIONS.USER_VIEW),
  async (req: Request, res: Response) => {
    try {
      const users = await User.find().select('-password').populate('roles');
      res.json(users);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: 'An unknown error occurred' });
      }
    }
  });

// Récupérer un utilisateur par son ID
router.get('/users/:id',
  auth,
  hasPermission(PERMISSIONS.USER_VIEW),
  async (req: Request, res: Response) => {
    try {
      const user = await User.findById(req.params.id).select('-password').populate('roles');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: 'An unknown error occurred' });
      }
    }
  });

// Mettre à jour un utilisateur
router.put('/users/:id',
  auth,
  hasPermission(PERMISSIONS.USER_UPDATE),
  async (req: Request, res: Response) => {
    try {
      const { password, ...updateData } = req.body;

      const user = await User.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      ).select('-password').populate('roles');

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: 'An unknown error occurred' });
      }
    }
  });

// Supprimer un utilisateur
router.delete('/users/:id',
  auth,
  hasPermission(PERMISSIONS.USER_DELETE),
  async (req: Request, res: Response) => {
    try {
      if (req.params.id === req.user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'You cannot delete your own account'
        });
      }

      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: 'An unknown error occurred' });
      }
    }
  });

// === Routes pour la gestion des rôles ===

// Récupérer tous les rôles
router.get('/roles',
  auth,
  hasPermission(PERMISSIONS.ROLE_MANAGE),
  async (req: Request, res: Response) => {
    try {
      const roles = await roleService.getAllRoles();
      res.json(roles);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: 'An unknown error occurred' });
      }
    }
  });

// Récupérer un rôle par son ID
router.get('/roles/:id',
  auth,
  hasPermission(PERMISSIONS.ROLE_MANAGE),
  async (req: Request, res: Response) => {
    try {
      const role = await roleService.getRoleById(req.params.id);
      if (!role) {
        return res.status(404).json({ success: false, message: 'Role not found' });
      }

      res.json(role);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: 'An unknown error occurred' });
      }
    }
  });

// Créer un nouveau rôle
router.post('/roles',
  auth,
  hasPermission(PERMISSIONS.ROLE_MANAGE),
  async (req: Request, res: Response) => {
    try {
      const role = await roleService.createRole(req.body);
      res.status(201).json(role);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: 'An unknown error occurred' });
      }
    }
  });

// Mettre à jour un rôle
router.put('/roles/:id',
  auth,
  hasPermission(PERMISSIONS.ROLE_MANAGE),
  async (req: Request, res: Response) => {
    try {
      const role = await roleService.updateRole(req.params.id, req.body);
      if (!role) {
        return res.status(404).json({ success: false, message: 'Role not found' });
      }

      res.json(role);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: 'An unknown error occurred' });
      }
    }
  });

// Supprimer un rôle
router.delete('/roles/:id',
  auth,
  hasPermission(PERMISSIONS.ROLE_MANAGE),
  async (req: Request, res: Response) => {
    try {
      const role = await roleService.deleteRole(req.params.id);
      if (!role) {
        return res.status(404).json({ success: false, message: 'Role not found' });
      }

      res.json({ success: true, message: 'Role deleted successfully' });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: 'An unknown error occurred' });
      }
    }
  });

// === Routes pour la gestion des rôles des utilisateurs ===

// Assigner un rôle à un utilisateur
router.post('/users/:userId/roles/:roleId',
  auth,
  hasPermission(PERMISSIONS.ROLE_MANAGE),
  async (req: Request, res: Response) => {
    try {
      const user = await User.findById(req.params.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const role = await Role.findById(req.params.roleId);
      if (!role) {
        return res.status(404).json({ success: false, message: 'Role not found' });
      }

      const updatedUser = await roleService.assignRoleToUser(req.params.userId, req.params.roleId);
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: 'An unknown error occurred' });
      }
    }
  });

// Retirer un rôle d'un utilisateur
router.delete('/users/:userId/roles/:roleId',
  auth,
  hasPermission(PERMISSIONS.ROLE_MANAGE),
  async (req: Request, res: Response) => {
    try {
      const user = await User.findById(req.params.userId).populate('roles');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const role = await Role.findById(req.params.roleId);
      if (!role) {
        return res.status(404).json({ success: false, message: 'Role not found' });
      }

      if (user.roles.length <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot remove the last role from a user'
        });
      }

      if (req.params.userId === req.user._id.toString() &&
        role.name === DEFAULT_ROLES.ADMIN) {
        return res.status(400).json({
          success: false,
          message: 'You cannot remove the admin role from your own account'
        });
      }

      const updatedUser = await roleService.removeRoleFromUser(req.params.userId, req.params.roleId);
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: 'An unknown error occurred' });
      }
    }
  });

// Obtenir les utilisateurs ayant un rôle spécifique
router.get('/roles/:roleId/users',
  auth,
  hasPermission(PERMISSIONS.ROLE_MANAGE),
  async (req: Request, res: Response) => {
    try {
      const role = await Role.findById(req.params.roleId);
      if (!role) {
        return res.status(404).json({ success: false, message: 'Role not found' });
      }

      const users = await roleService.getUsersByRole(req.params.roleId);
      res.json(users);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: 'An unknown error occurred' });
      }
    }
  });

// === Dashboard d'administration ===

// Obtenir les statistiques pour le dashboard d'administration
router.get('/dashboard',
  auth,
  hasPermission(PERMISSIONS.ADMIN_ACCESS),
  async (req: Request, res: Response) => {
    try {
      const userCount = await User.countDocuments();
      const roleCount = await Role.countDocuments();

      res.json({
        success: true,
        stats: {
          userCount,
          roleCount
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: 'An unknown error occurred' });
      }
    }
  });

export const adminAPI = router;