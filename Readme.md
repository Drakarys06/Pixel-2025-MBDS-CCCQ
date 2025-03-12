# 2025 MBDS project PixelBoard

## Introduction
this is a mono-repo project for the 2025 MBDS project PixelBoard. It contains the following packages:
- `client`: the frontend of the project
- `api`: the backend of the project

You can use this skeleton to start your project.    
You have to edit the root package.json file : 
- replace the name property (replace xxxx by the first letter of each member of your group)
- set the repository by setting the url of your project  


## Installation

To lauch the project, you need to do the following commands in the root directory of the project:
``` js
npm run all
```

When the project is launched, you can access the frontend at the following url:
- http://localhost:5173/


## Project structure

```
src/
├── components/           # Composants organisés par catégorie
│   ├── layout/           # Composants de mise en page
│   │   ├── Container.tsx
│   │   ├── Layout.tsx
│   │   └── Navbar.tsx
│   │
│   ├── ui/               # Composants UI réutilisables
│   │   ├── Alert.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── FormComponents.tsx
│   │   ├── Loader.tsx
│   │   ├── PixelBoardCard.tsx
│   │   ├── PixelGrid.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── ThemeContext.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── TimeRemaining.tsx
│   │
│   ├── features/         # Composants spécifiques aux fonctionnalités
│   │   ├── BoardControls.tsx
│   │   ├── BoardInfo.tsx
│   │   └── CreateBoardForm.tsx
│   │
│   └── pages/            # Composants de page
│       ├── BoardViewPage.tsx
│       ├── CreateBoardPage.tsx
│       ├── ExplorePage.tsx
│       ├── HomePage.tsx
│       └── NotFoundPage.tsx
│
├── styles/               # Styles organisés par type de composant
│   ├── layout/           # Styles des composants de mise en page
│   │   ├── Container.css
│   │   ├── Layout.css
│   │   └── Navbar.css
│   │
│   ├── ui/               # Styles des composants UI
│   │   ├── Alert.css
│   │   ├── Button.css
│   │   ├── Card.css
│   │   ├── FormComponents.css
│   │   ├── Loader.css
│   │   ├── PixelBoardCard.css
│   │   ├── PixelGrid.css
│   │   ├── ProgressBar.css
│   │   ├── ThemeToggle.css
│   │   └── TimeRemaining.css
│   │
│   ├── features/         # Styles des composants de fonctionnalités
│   │   ├── BoardControls.css
│   │   ├── BoardInfo.css
│   │   └── CreateBoardForm.css
│   │
│   ├── pages/            # Styles des pages
│   │   ├── BoardViewPage.css
│   │   ├── CreateBoardPage.css
│   │   ├── ExplorePage.css
│   │   ├── HomePage.css
│   │   └── NotFoundPage.css
│   │
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