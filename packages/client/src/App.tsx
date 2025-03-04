import { useState } from 'react';
import logo from './logo.svg';
import './App.css';

interface Response {
  response?: string;
}

function App() {
  const [resp, setResp] = useState<Response | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean | null>(null);

  const handleClickTest = async () => {
    console.log('VITE_API_URL', import.meta.env.VITE_API_URL);
    setError(null);
    setResp(null);
    setLoading(true);

    await fetch(import.meta.env.VITE_API_URL)
      .then((response) => response.json())
      .then((data: Response) => {
        console.log(data);
        setResp(data);
      })
      .catch((err: Error) => {
        console.error('err:', err);
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };
  
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Project MBDS 2025 - SKELETON</p>
        <br />
        <button type="button" onClick={handleClickTest}>Call API for test</button>
        {loading && <p>loading...</p>}
        {resp && <p>ok = {resp.response}</p>}
        {error && <p>error = {error.message}</p>}
      </header>
    </div>
  );
}

export default App;