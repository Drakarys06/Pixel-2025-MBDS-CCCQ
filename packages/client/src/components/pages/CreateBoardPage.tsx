import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layout/Layout';
import CreateBoardForm, { BoardFormData } from '../features/CreateBoardForm';
import Alert from '../ui/Alert';
import Card from '../ui/Card';
import '../../styles/pages/CreateBoardPage.css';

const CreateBoardPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();
  
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
      const response = await fetch(`${API_URL}/api/pixelboards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
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
      
      <div className="create-board-container">
        <div className="create-board-main">
          <CreateBoardForm onSubmit={handleSubmit} loading={loading} />
        </div>
        
        <div className="create-board-info">
          <Card>
            <Card.Header>
              <h3 className="info-title">Board Guidelines</h3>
            </Card.Header>
            <Card.Body>
              <ul className="guidelines-list">
                <li>Choose dimensions that suit your artistic vision but consider that larger boards may take longer to fill.</li>
                <li>Set an appropriate time limit - we recommend 30 minutes for small boards and longer for larger ones.</li>
                <li>The "Allow Redraw" option lets users place pixels over existing ones.</li>
                <li>Visitor mode allows viewing after the board's active time has expired.</li>
              </ul>
            </Card.Body>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default CreateBoardPage;