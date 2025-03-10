import { useState } from 'react';
import './App.css';
import './styles/PixelBoard.css';
import PixelBoardContainer from './components/PixelBoardContainer';

function App() {
  const [showPixelBoard, setShowPixelBoard] = useState(false);

  return (
    <div className="App">
      {!showPixelBoard ? (
        <header className="App-header">
          <h1>PixelBoard Project</h1>
          <p>MBDS 2025 - Welcome to the PixelBoard application</p>
          <button 
            className="primary-button"
            onClick={() => setShowPixelBoard(true)}
          >
            Go to PixelBoard Management
          </button>
        </header>
      ) : (
        <div className="app-content">
          <button 
            className="back-button"
            onClick={() => setShowPixelBoard(false)}
          >
            ← Back to Home
          </button>
          <PixelBoardContainer />
        </div>
      )}
    </div>
  );
}

export default App;