import React from 'react';
import '../../styles/ui/Card.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  const classes = ['card-header', className].filter(Boolean).join(' ');
  return <div className={classes}>{children}</div>;
};

const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => {
  const classes = ['card-body', className].filter(Boolean).join(' ');
  return <div className={classes}>{children}</div>;
};

const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  const classes = ['card-footer', className].filter(Boolean).join(' ');
  return <div className={classes}>{children}</div>;
};

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  const classes = ['card', className].filter(Boolean).join(' ');
  return <div className={classes}>{children}</div>;
};

// Add static properties for sub-components
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;