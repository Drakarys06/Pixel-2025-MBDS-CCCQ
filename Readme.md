# 2025 MBDS project PixelBoard - Equipe 4

## Contributeurs

- **Clément COLIN** ALonelyDuck 
- **Nicolas QUATELA** NicolasQua
- **Thomas CHOUBRAC** Drakarys06
- **Thibault CANAVAGGIO** Canavaggio-Thibault

## Introduction

Ceci est un projet mono-repo pour le projet PixelBoard MBDS 2025. Il contient les paquets suivants :
- `client` : le frontend du projet développé avec React
- `api` : le backend du projet développé avec Express

Cette structure permet une organisation claire et une gestion centralisée des dépendances.

## Installation et lancement

Pour installer et lancer le projet en mode développement, exécutez les commandes suivantes dans le répertoire racine :

```js
npm install
npm run all
```

Cette commande installera toutes les dépendances et démarrera simultanément le serveur backend et l'application frontend.

Lorsque le projet est lancé, vous pouvez accéder au frontend à l'URL suivante :
- http://localhost:5173/

Le serveur API sera accessible à :
- http://localhost:8000/api/

## Mode production

Pour lancer le projet en mode production, vous pouvez utiliser :

```js
npm run prod
```

Cette commande configure la variable d'environnement `VITE_API_URL` pour pointer vers le serveur déployé et lance les deux services en mode production. Dans ce mode, le frontend sera accessible depuis n'importe quelle adresse IP de la machine hôte.

## Variables d'environnement

Le projet utilise les variables d'environnement suivantes :
- `VITE_API_URL` : URL de l'API backend (par défaut : http://localhost:8000)
- `HOST` : Adresse d'écoute du serveur API en production (par défaut : 0.0.0.0)

## Outils de développement

Le projet est configuré avec :
- **TypeScript** pour un typage statique rigoureux
- **ESLint** pour la qualité et la cohérence du code
- **Vite** pour un développement rapide avec rechargement à chaud

Pour exécuter le linting sur le code, utilisez :

```js
npm run lint
```

## Fonctionnalités implémentées

### Fonctionnalités principales

#### Page d'accueil
- ✅ Page d'accueil publique avec options de connexion/inscription - Thomas CHOUBRAC et Nicolas QUATELA
- ✅ Affichage du nombre d'utilisateurs inscrits - Nicolas QUATELA
- ✅ Affichage du nombre total de PixelBoard - Nicolas QUATELA
- ✅ Prévisualisation des PixelBoard actifs - Thomas CHOUBRAC
- ✅ Prévisualisation des PixelBoard terminés - Thomas CHOUBRAC

#### Administrateurs / Mes Tableaux
- ✅ Créer un PixelBoard avec propriétés personnalisables - Thomas CHOUBRAC
- ✅ Modifier et supprimer les PixelBoard - Thomas CHOUBRAC
- ✅ Afficher, trier et filtrer tous les PixelBoard - Thomas CHOUBRAC

#### Fonctionnalités PixelBoard
- ✅ Affichage des propriétés du PixelBoard - Thomas CHOUBRAC
  - ✅ Temps restant avant fermeture - Thomas CHOUBRAC
  - ✅ Titre, taille, délai entre contributions - Thomas CHOUBRAC
  - ✅ Option pour dessiner par-dessus les pixels existants - Thomas CHOUBRAC

#### Visiteurs (Invités)
- ✅ Fonctionnalité d'inscription - Thibault CANAVAGGIO
- ✅ Dessin sur les PixelBoard - Nicolas QUATELA et Clément COLIN

#### Utilisateurs
- ✅ Fonctionnalité de connexion - Thibault CANAVAGGIO
- ✅ Authentification simple (JWT) - Thibault CANAVAGGIO
- ✅ Voir et modifier les informations de profil - Thibault CANAVAGGIO
- ✅ Changer le thème de l'application - Thomas CHOUBRAC
- ✅ Voir les contributions - Nicolas QUATELA 
  - ✅ Contributions aux PixelBoard - Nicolas QUATELA 
  - ✅ Nombre total de pixels ajoutés - Nicolas QUATELA 

### Thème
- ✅ Options de thème clair et sombre - Thomas CHOUBRAC
- ✅ Préférence de thème enregistrée dans le navigateur - Thomas CHOUBRAC
- ✅ Détection automatique de la préférence système pour le mode sombre - Thomas CHOUBRAC

### Fonctionnalités bonus
- ✅ WebSockets pour mises à jour du dessin en temps réel (🥷 Difficile) - Clément COLIN
- ✅ Export d'un PixelBoard en image (SVG/PNG) (🐵 Facile) - Clément COLIN
- ✅ Heatmap montrant les zones les plus utilisées (🐵/🦁 Facile/Moyen)
- ✅ Historique des contributions pour chaque pixel (🥷 Difficile)
- ✅ Déploiement du projet en ligne (🦁 Moyen) - Clément COLIN
- ✅ Mode replay pour la visualisation du dessin (🥷 Difficile) - Nicolas QUATELA 
- ❌ SuperPixelBoard montrant toutes les créations (🐵 Facile)
- ✅ Téléchargement et conversion d'images en pixel art (🦁 Moyen)

🐵 = Facile, 🦁 = Moyen, 🥷 = Difficile

## Stack technique

### Backend
- **Framework**: Express.js avec TypeScript
- **Base de données**: MongoDB avec Mongoose ODM
- **Authentification**: JWT (JSON Web Tokens)
- **Temps réel**: Socket.io pour WebSockets
- **Structure API**: RESTful

### Frontend
- **Framework**: React avec TypeScript
- **Outil de build**: Vite
- **Routage**: React Router
- **Gestion d'état**: React Context API
- **Style**: Modules CSS avec support de thème
- **Client temps réel**: Socket.io-client

## Structure du projet
```
src/
├── components/           # Composants organisés par catégorie
│   ├── layout/           # Composants de mise en page
│   ├── ui/               # Composants UI réutilisables
│   ├── features/         # Composants spécifiques aux fonctionnalités
│   └── pages/            # Composants de page
│
├── styles/               # Styles organisés par type de composant
│   ├── layout/           # Styles des composants de mise en page
│   ├── ui/               # Styles des composants UI
│   ├── features/         # Styles des composants de fonctionnalités
│   ├── pages/            # Styles des pages
│   ├── App.css           # Style global de l'application
│   ├── colors.css        # Variables de couleurs
│   └── index.css         # Reset CSS et styles de base
│
├── utils/                # Fonctions utilitaires
│   └── timeUtils.ts      # Fonctions pour les calculs de temps
│
├── App.tsx               # Composant principal avec routes
└── main.tsx              # Point d'entrée de l'application
```

## Routes API

### Routes d'authentification
- `POST /api/auth/signup` - Inscription d'un nouvel utilisateur
- `POST /api/auth/login` - Connexion d'un utilisateur
- `GET /api/auth/verify` - Vérification de validité du token JWT
- `POST /api/auth/guest-login` - Connexion en tant qu'invité

### Routes utilisateur
- `GET /api/admin/users` - Récupérer tous les utilisateurs (admin)
- `GET /api/admin/users/:id` - Récupérer un utilisateur par ID
- `PUT /api/admin/users/:id` - Mettre à jour un utilisateur
- `DELETE /api/admin/users/:id` - Supprimer un utilisateur

### Routes des rôles
- `GET /api/admin/roles` - Récupérer tous les rôles
- `GET /api/admin/roles/:id` - Récupérer un rôle par ID
- `POST /api/admin/roles` - Créer un nouveau rôle
- `PUT /api/admin/roles/:id` - Mettre à jour un rôle
- `DELETE /api/admin/roles/:id` - Supprimer un rôle
- `POST /api/admin/users/:userId/roles/:roleId` - Assigner un rôle à un utilisateur
- `DELETE /api/admin/users/:userId/roles/:roleId` - Retirer un rôle d'un utilisateur

### Routes PixelBoard
- `GET /api/pixelboards` - Récupérer tous les tableaux
- `GET /api/pixelboards/:id` - Récupérer un tableau par ID
- `GET /api/pixelboards/my-boards` - Récupérer les tableaux créés par l'utilisateur
- `GET /api/pixelboards/contributed-boards` - Récupérer les tableaux où l'utilisateur a contribué
- `POST /api/pixelboards` - Créer un nouveau tableau
- `PUT /api/pixelboards/:id` - Mettre à jour un tableau
- `DELETE /api/pixelboards/:id` - Supprimer un tableau

### Routes Pixel
- `GET /api/pixels` - Récupérer tous les pixels (avec filtrage par boardId)
- `GET /api/pixels/:id` - Récupérer un pixel par ID
- `POST /api/pixels/board/:boardId/place` - Placer un pixel sur un tableau
- `DELETE /api/pixels/:id` - Supprimer un pixel
- `GET /api/pixels/board/:boardId/contributors` - Récupérer les contributeurs d'un tableau

### Routes statistiques
- `GET /api/stats/home` - Récupérer les statistiques pour la page d'accueil

## Événements WebSockets

Le système utilise Socket.io pour les communications en temps réel avec les événements suivants :

### Événements côté client
- `joinBoard` - Rejoindre un tableau spécifique pour recevoir les mises à jour
- `leaveBoard` - Quitter un tableau spécifique
- `pixelPlaced` (écoute) - Réception d'un pixel placé par un autre utilisateur

### Événements côté serveur
- `connection` - Gestion des connexions clients
- `disconnect` - Gestion des déconnexions
- `joinBoard` - Abonnement d'un client à un tableau
- `leaveBoard` - Désabonnement d'un client d'un tableau
- `pixelPlaced` (émission) - Diffusion d'un pixel placé aux clients abonnés

## Schéma de la base de données

### Collection Users
```
{
  _id: ObjectId,
  username: String,       // Nom d'utilisateur unique
  email: String,          // Email unique
  password: String,       // Mot de passe hashé
  pixelsPlaced: Number,   // Nombre total de pixels placés
  boardsCreated: Number,  // Nombre de tableaux créés
  roles: [ObjectId],      // Références aux rôles
  createdAt: Date,
  updatedAt: Date
}
```

### Collection PixelBoard
```
{
  _id: ObjectId,
  title: String,          // Titre du tableau
  length: Number,         // Hauteur en pixels
  width: Number,          // Largeur en pixels
  time: Number,           // Durée en minutes
  redraw: Boolean,        // Autoriser redessin
  closeTime: Date,        // Date de fermeture (null si ouvert)
  creationTime: Date,     // Date de création
  creator: String,        // ID du créateur
  creatorUsername: String, // Nom du créateur
  visitor: Boolean,       // Autorise invités
  cooldown: Number,       // Délai entre placements en secondes
  contributors: [         // Liste des contributeurs
    {
      userId: String,
      username: String,
      pixelsCount: Number,
      lastPixelTime: Date
    }
  ]
}
```

### Collection Pixel
```
{
  _id: ObjectId,
  x: Number,              // Coordonnée X
  y: Number,              // Coordonnée Y
  color: String,          // Couleur hexadécimale
  lastModifiedDate: Date, // Date dernière modification
  modifiedBy: [String],   // IDs des modificateurs
  boardId: ObjectId,      // Référence au tableau
  modificationCount: Number, // Nombre de modifications
  createdAt: Date,
  updatedAt: Date
}
```

### Collection Role
```
{
  _id: ObjectId,
  name: String,           // Nom du rôle
  description: String,    // Description
  permissions: [String],  // Liste des permissions
  isDefault: Boolean,     // Rôle par défaut
  createdAt: Date,
  updatedAt: Date
}
```

### Collection PixelHistory
```
{
  "_id": ObjectId,
  "x": Number,              // Coordonnée X du pixel
  "y": Number,              // Coordonnée Y du pixel
  "color": String,          // Couleur hexadécimale (ex: "#000000")
  "timestamp": Date,        // Horodatage exact du placement
  "userId": String,         // ID de l'utilisateur qui a placé le pixel
  "username": String,       // Nom d'utilisateur pour affichage
  "boardId": ObjectId,      // Référence au tableau parent
  "createdAt": Date,        // Date de création de l'enregistrement
  "updatedAt": Date         // Date de dernière modification
}
```

## Système d'authentification et autorisations

L'application implémente un système de contrôle d'accès basé sur les rôles suivants :

### Rôles et permissions

#### Admin
```json
{
  "name": "admin",
  "description": "Accès complet à toutes les fonctionnalités",
  "permissions": [
    "user:view", "user:create", "user:update", "user:delete",
    "board:view", "board:create", "board:update", "board:delete",
    "pixel:view", "pixel:create", "pixel:update", "pixel:delete",
    "admin:access", "role:manage"
  ]
}
```

#### Moderator
```json
{
  "name": "moderator",
  "description": "Peut gérer le contenu mais pas les utilisateurs ou paramètres",
  "permissions": [
    "user:view", 
    "board:view", "board:create", "board:update", "board:delete", 
    "pixel:view", "pixel:create", "pixel:update", "pixel:delete"
  ]
}
```

#### User
```json
{
  "name": "user",
  "description": "Utilisateur authentifié standard",
  "permissions": [
    "user:view",
    "board:view", "board:create", "board:update",
    "pixel:view", "pixel:create"
  ],
  "isDefault": true
}
```

#### Guest
```json
{
  "name": "guest",
  "description": "Visiteur non authentifié",
  "permissions": [
    "board:view", "pixel:view", "pixel:create"
  ]
}
```

### Fonctionnement de l'authentification

1. **Inscription** : L'utilisateur s'inscrit via `/api/auth/signup` et reçoit le rôle "user" par défaut
2. **Connexion** : L'utilisateur se connecte via `/api/auth/login` et reçoit un JWT contenant son ID
3. **Mode invité** : Les visiteurs peuvent se connecter en tant qu'invité via `/api/auth/guest-login` avec des permissions limitées
4. **Vérification** : Chaque requête à l'API est vérifiée via le middleware `auth` qui extrait l'utilisateur du token

Les middleware `hasPermission` et `hasRole` vérifient ensuite les droits d'accès spécifiques pour chaque route protégée, offrant ainsi une gestion fine des autorisations basée sur les rôles et permissions.
