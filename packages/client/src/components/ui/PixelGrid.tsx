import React from 'react';
import '../../styles/ui/PixelGrid.css';

interface Pixel {
  x: number;
  y: number;
  color: string;
}

interface PixelGridProps {
  width: number;
  height: number;
  pixels: Pixel[];
  cellSize?: number;
  editable?: boolean;
  onPixelClick?: (x: number, y: number) => void;
  className?: string;
  loading?: boolean;
}

const PixelGrid: React.FC<PixelGridProps> = ({
  width,
  height,
  pixels,
  cellSize = 25,
  editable = true,
  onPixelClick,
  className = '',
  loading = false
}) => {
  // Create a 2D grid representation for faster lookups
  const pixelMap = React.useMemo(() => {
    const map: { [key: string]: Pixel } = {};
    
    pixels.forEach(pixel => {
      map[`${pixel.x},${pixel.y}`] = pixel;
    });
    
    return map;
  }, [pixels]);

  const handleCellClick = (x: number, y: number) => {
    if (editable && onPixelClick && !loading) {
      onPixelClick(x, y);
    }
  };

  const renderGrid = () => {
    const cells = [];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const key = `${x},${y}`;
        const pixel = pixelMap[key];
        const cellColor = pixel ? pixel.color : 'white';
        
        cells.push(
          <div
            key={key}
            className={`pixel-cell ${loading ? 'pixel-cell-disabled' : ''} ${!editable ? 'pixel-cell-readonly' : ''}`}
            style={{
              backgroundColor: cellColor
            }}
            onClick={() => handleCellClick(x, y)}
            title={`(${x}, ${y})`}
            data-coords={`(${x}, ${y})`}
          />
        );
      }
    }
    
    return cells;
  };

  const gridClasses = [
    'pixel-grid',
    loading ? 'pixel-grid-loading' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className="pixel-grid-wrapper"
      style={{ maxWidth: `${width * (cellSize + 1)}px` }}
    >
      <div 
        className={gridClasses}
        style={{
          gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${height}, ${cellSize}px)`
        }}
      >
        {renderGrid()}
      </div>
      {loading && (
        <div className="pixel-grid-loading-overlay">
          <div className="pixel-grid-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default PixelGrid;