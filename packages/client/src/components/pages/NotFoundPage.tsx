import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../layout/Layout';
import Button from '../ui/Button';
import '../../styles/pages/NotFoundPage.css';

interface NotFoundPageProps {
  message?: string;
}

const NotFoundPage: React.FC<NotFoundPageProps> = ({ 
  message = 'Page not found' 
}) => {
  return (
    <Layout showNavbar={true}>
      <div className="not-found-container">
        <div className="not-found-content">
          <h1 className="not-found-title">{message}</h1>
          <p className="not-found-text">
            The page you're looking for is not available or is under development.
          </p>
          <Link to="/">
            <Button variant="primary">Return to Home</Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default NotFoundPage;