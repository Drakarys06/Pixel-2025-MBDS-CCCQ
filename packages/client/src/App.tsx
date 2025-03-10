import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import './styles/PixelBoard.css';
import './styles/HomePage.css';
import './styles/ExploreBoards.css';
import HomePage from './components/HomePage';
import PixelBoardContainer from './components/PixelBoardContainer';
import ExploreBoards from './components/ExploreBoards';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<PixelBoardContainer />} />
          <Route path="/explore" element={<ExploreBoards />} />
          <Route path="/boards" element={<div className="page-placeholder">My Boards page coming soon</div>} />
          <Route path="/login" element={<div className="page-placeholder">Login page coming soon</div>} />
          <Route path="/signup" element={<div className="page-placeholder">Signup page coming soon</div>} />
          <Route path="/board/:id" element={<div className="page-placeholder">Board detail page coming soon</div>} />
          <Route path="*" element={<div className="page-placeholder">Page not found</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;