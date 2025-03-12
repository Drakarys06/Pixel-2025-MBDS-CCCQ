import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ui/ThemeContext';
import HomePage from './components/pages/HomePage';
import ExplorePage from './components/pages/ExplorePage';
import CreateBoardPage from './components/pages/CreateBoardPage';
import BoardViewPage from './components/pages/BoardViewPage';
import NotFoundPage from './components/pages/NotFoundPage';
import './styles/App.css';

// Import global stylesheets
import './styles/index.css';
import './styles/colors.css';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/create" element={<CreateBoardPage />} />
          <Route path="/board/:id" element={<BoardViewPage />} />
          
          {/* Placeholder routes with simple not-found */}
          <Route path="/boards" element={<NotFoundPage message="My Boards page coming soon" />} />
          <Route path="/login" element={<NotFoundPage message="Login page coming soon" />} />
          <Route path="/signup" element={<NotFoundPage message="Signup page coming soon" />} />
          
          {/* 404 route */}
          <Route path="*" element={<NotFoundPage message="Page not found" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App; 