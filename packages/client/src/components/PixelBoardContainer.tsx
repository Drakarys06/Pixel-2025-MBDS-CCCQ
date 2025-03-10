import React, { useState, useEffect } from 'react';
import PixelBoardForm, { PixelBoardData } from './PixelBoardForm';
import PixelBoardList from './PixelBoardList';
import { Link, NavLink } from 'react-router-dom';

interface PixelBoard {
    _id: string;
    title: string;
    length: number;
    width: number;
    time: number;
    redraw: boolean;
    closeTime: string | null;
    creationTime: string;
    creator: string;
    visitor: boolean;
}

const PixelBoardContainer: React.FC = () => {
    const [pixelBoards, setPixelBoards] = useState<PixelBoard[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [formLoading, setFormLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    // Fetch pixel boards
    const fetchPixelBoards = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('Fetching from:', `${API_URL}/api/pixelboards`);
            const response = await fetch(`${API_URL}/api/pixelboards`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch pixel boards: ${response.status} ${response.statusText} - ${errorText}`);
            }
            const data = await response.json();
            console.log('Received data:', data);
            setPixelBoards(data);
        } catch (err) {
            console.error('Full error details:', err);
            setError('Error fetching pixel boards. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Create a new pixel board
    const createPixelBoard = async (pixelBoardData: PixelBoardData) => {
        setFormLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const response = await fetch(`${API_URL}/api/pixelboards`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(pixelBoardData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create pixel board');
            }

            // Refresh the pixel boards list
            fetchPixelBoards();
            setSuccessMessage('Pixel board created successfully!');

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred');
            }
            console.error('Error creating pixel board:', err);
        } finally {
            setFormLoading(false);
        }
    };

    // Delete a pixel board
    const deletePixelBoard = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this pixel board?')) {
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/api/pixelboards/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete pixel board');
            }

            // Update local state
            setPixelBoards(prevBoards => prevBoards.filter(board => board._id !== id));
            setSuccessMessage('Pixel board deleted successfully!');

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
        } catch (err) {
            setError('Error deleting pixel board. Please try again.');
            console.error('Error deleting pixel board:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch pixel boards when the component mounts
    useEffect(() => {
        fetchPixelBoards();
    }, []);

    return (
        <div className="explore-container">
            <header className="explore-header">
                <nav className="explore-nav">
                    <Link to="/" className="explore-logo">PixelBoard</Link>
                    
                    <div className="nav-links">
                        <NavLink to="/explore" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
                            Explore
                        </NavLink>
                        <NavLink to="/create" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
                            Create
                        </NavLink>
                        <NavLink to="/boards" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
                            My Boards
                        </NavLink>
                    </div>
                    
                    <div className="nav-auth">
                        <Link to="/login" className="btn-login">Log in</Link>
                        <Link to="/signup" className="btn-signup">Sign up</Link>
                    </div>
                </nav>
            </header>

            <div className="explore-content">
                <h1 className="explore-title">PixelBoard Management</h1>

                {error && <div className="error-message">{error}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}

                <div className="container-layout">
                    <div className="form-section">
                        <PixelBoardForm onSubmit={createPixelBoard} loading={formLoading} />
                    </div>

                    <div className="list-section">
                        <PixelBoardList
                            pixelBoards={pixelBoards}
                            loading={loading}
                            onDelete={deletePixelBoard}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PixelBoardContainer;