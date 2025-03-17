import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layout/Layout';
import CreateBoardForm, { BoardFormData } from '../features/CreateBoardForm';
import Alert from '../ui/Alert';
import Card from '../ui/Card';
import { useAuth } from '../auth/AuthContext';
import '../../styles/pages/CreateBoardPage.css';

const CreateBoardPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Clear alerts when component unmounts
  useEffect(() => {
    return () => {
      if (success) {
        setSuccess(null);
      }
      if (error) {
        setError(null);
      }
    };
  }, []);

  // Handle form submission
  const handleSubmit = async (formData: BoardFormData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Récupérer le token d'authentification
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('You must be logged in to create a board');
      }
      
      const response = await fetch(`${API_URL}/api/pixelboards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
        // Le backend s'occupera d'ajouter creator et creatorUsername automatiquement
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create board');
      }

      const createdBoard = await response.json();
      setSuccess('Board created successfully!');
      
      // Redirect to the new board after a short delay
      setTimeout(() => {
        navigate(`/board/${createdBoard._id}`);
      }, 1500);
    } catch (err) {
      console.error('Error creating board:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Si l'utilisateur est en mode invité, afficher un message explicatif
  const isGuest = currentUser?.isGuest;

  return (
    <Layout title="Create Pixel Board">
      {error && (
        <Alert 
          variant="error"
          message={error}
          dismissible
          onClose={() => setError(null)}
        />
      )}
      
      {success && (
        <Alert 
          variant="success"
          message={success}
          dismissible
          onClose={() => setSuccess(null)}
        />
      )}
      
      {isGuest && (
        <Alert
          variant="info"
          message="You are in guest mode. Consider creating an account to keep track of your boards."
          dismissible
        />
      )}
      
      <div className="create-board-container">
        <div className="create-board-main">
          <CreateBoardForm 
            onSubmit={handleSubmit} 
            loading={loading}
          />
        </div>
        
        <div className="create-board-info">
          <Card>
            <div className="card-header">
              <h3 className="info-title">Board Guidelines</h3>
            </div>
            <div className="card-body">
              <ul className="guidelines-list">
                <li>Choose dimensions that suit your artistic vision but consider that larger boards may take longer to fill.</li>
                <li>Set an appropriate time limit - we recommend 30 minutes for small boards and longer for larger ones.</li>
                <li>The "Allow Redraw" option lets users place pixels over existing ones.</li>
                <li>Visitor mode allows viewing after the board's active time has expired.</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default CreateBoardPage;