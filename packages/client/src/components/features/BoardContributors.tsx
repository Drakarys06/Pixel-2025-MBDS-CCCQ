import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Loader from '../ui/Loader';
import '../../styles/features/BoardContributors.css';

export interface Contributor {
    userId: string;
    username: string;
    pixelsCount: number;
    lastPixelTime: Date;
}

interface BoardContributorsProps {
    boardId: string;
    refreshTrigger?: number;
}

const BoardContributors: React.FC<BoardContributorsProps> = ({ boardId, refreshTrigger = 0 }) => {
    const [contributors, setContributors] = useState<Contributor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<{id: string, username: string} | null>(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    // Fonction utilitaire pour formater les noms d'utilisateurs
    const formatUsername = (userId?: string, username?: string): string => {
        // Vérification des paramètres d'entrée
        if (!userId) {
            return 'Anonymous';
        }

        // Gestion des utilisateurs invités
        if (typeof userId === 'string' && userId.startsWith('guest-')) {
            const guestNumber = userId.substring(6, 11);
            return `Guest-${guestNumber}`;
        }
        
        // Si pas de nom d'utilisateur, retourner un nom par défaut
        return username || `User-${userId.substring(0, 5)}`;
    };

    // Récupérer l'utilisateur connecté en décodant le token JWT
    const fetchCurrentUser = () => {
        const token = localStorage.getItem('token');
        if (!token) return null;

        try {
            // Vérifier que le token a bien 3 parties
            const parts = token.split('.');
            if (parts.length !== 3) {
                console.warn('Token JWT invalide');
                return null;
            }

            // Décoder la partie payload du token JWT
            const base64Url = parts[1];
            const base64 = base64Url.replace('-', '+').replace('_', '/');
            const payload = JSON.parse(window.atob(base64));

            // Extraire l'ID et le nom d'utilisateur
            const userId = payload.sub || payload.userId || payload.id;
            const username = payload.username;

            return {
                id: userId,
                username: formatUsername(userId, username)
            };
        } catch (error) {
            console.error('Erreur lors du décodage du token:', error);
            return null;
        }
    };

    // Fonction de récupération des contributeurs
    const fetchContributors = async () => {
        if (!boardId) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`${API_URL}/api/pixels/board/${boardId}/contributors`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });

            if (!response.ok) {
                throw new Error('Impossible de récupérer les contributeurs');
            }

            const data: Contributor[] = await response.json();
            
            // Formater les noms d'utilisateurs
            const formattedContributors = data.map(contributor => ({
                ...contributor,
                username: formatUsername(contributor.userId, contributor.username)
            }));

            // Vérifier et ajouter l'utilisateur connecté si nécessaire
            const user = fetchCurrentUser();
            setCurrentUser(user);

            if (user) {
                const userInContributors = formattedContributors.some(
                    contributor => contributor.userId === user.id
                );

                if (!userInContributors) {
                    formattedContributors.push({
                        userId: user.id,
                        username: user.username,
                        pixelsCount: 0,
                        lastPixelTime: new Date()
                    });
                }
            }
            
            setContributors(formattedContributors);
        } catch (err) {
            console.error('Erreur lors de la récupération des contributeurs:', err);
            setError(err instanceof Error ? err.message : 'Échec du chargement des contributeurs');
        } finally {
            setLoading(false);
        }
    };

    // Rafraîchissement des contributeurs 
    useEffect(() => {
        fetchContributors();
    }, [boardId, API_URL, refreshTrigger]); 

    // Calculer le total des pixels placés
    const totalPixels = contributors.reduce((sum, contributor) => sum + contributor.pixelsCount, 0);

    if (loading && contributors.length === 0) {
        return (
            <Card className="contributors-card">
                <div className="card-header">
                    <h3 className="contributors-title">Contributeurs du tableau</h3>
                </div>
                <div className="card-body">
                    <Loader size="sm" text="Chargement des contributeurs..." />
                </div>
            </Card>
        );
    }

    if (error && contributors.length === 0) {
        return (
            <Card className="contributors-card">
                <div className="card-header">
                    <h3 className="contributors-title">Contributeurs du tableau</h3>
                </div>
                <div className="card-body">
                    <div className="contributors-error">{error}</div>
                </div>
            </Card>
        );
    }

    return (
        <Card className="contributors-card">
            <div className="card-header">
                <div className="contributors-header">
                    <h3 className="contributors-title">Contributeurs du tableau</h3>
                    {loading && (
                        <div className="refresh-indicator">
                            <Loader size="sm" />
                        </div>
                    )}
                </div>
            </div>
            <div className="card-body">
                {contributors.length === 0 ? (
                    <div className="no-contributors">
                        Aucun pixel n'a encore été placé sur ce tableau.
                    </div>
                ) : (
                    <>
                        <div className="contributors-stats">
                            <div className="stat-item">
                                <span className="stat-label">Total des pixels :</span>
                                <span className="stat-value">{totalPixels}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Total des contributeurs :</span>
                                <span className="stat-value">{contributors.length}</span>
                            </div>
                        </div>

                        <div className="contributors-table-container">
                            <table className="contributors-table">
                                <thead>
                                <tr>
                                    <th>Utilisateur</th>
                                    <th>Pixels placés</th>
                                    <th>Contribution %</th>
                                </tr>
                                </thead>
                                <tbody>
                                {contributors.map((contributor) => (
                                    <tr 
                                        key={contributor.userId} 
                                        className={currentUser && currentUser.id === contributor.userId ? 'current-user' : ''}
                                    >
                                        <td>{contributor.username}</td>
                                        <td className="pixel-count">{contributor.pixelsCount}</td>
                                        <td className="contribution-percent">
                                            {totalPixels ? ((contributor.pixelsCount / totalPixels) * 100).toFixed(1) : 0}%
                                            <div
                                                className="contribution-bar"
                                                style={{
                                                    width: `${totalPixels ? (contributor.pixelsCount / totalPixels) * 100 : 0}%`
                                                }}
                                            ></div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </Card>
    );
};

export default BoardContributors;