import React from 'react';
import '../../styles/ui/Loader.css';

type LoaderSize = 'sm' | 'md' | 'lg';
type LoaderVariant = 'primary' | 'secondary' | 'light';

interface LoaderProps {
  size?: LoaderSize;
  variant?: LoaderVariant;
  fullPage?: boolean;
  text?: string;
  className?: string;
}

const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  variant = 'primary',
  fullPage = false,
  text,
  className = '',
}) => {
  const loaderClasses = [
    'loader',
    `loader-${size}`,
    `loader-${variant}`,
    fullPage ? 'loader-fullpage' : '',
    className
  ].filter(Boolean).join(' ');

  if (fullPage) {
    return (
      <div className="loader-overlay">
        <div className="loader-container">
          <div className={loaderClasses}></div>
          {text && <p className="loader-text">{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="loader-container">
      <div className={loaderClasses}></div>
      {text && <p className="loader-text">{text}</p>}
    </div>
  );
};

export default Loader;