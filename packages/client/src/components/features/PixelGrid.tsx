import React, { useEffect, useRef, useState } from 'react';
import '../../styles/ui/PixelGrid.css';

interface Pixel {
  _id: string;
  x: number;
  y: number;
  color: string;
  lastModifiedDate: string;
  modifiedBy: string[];
  boardId: string;
}

interface PixelGridProps {
  width: number;
  height: number;
  pixels: Pixel[];
  editable?: boolean;
  onPixelClick?: (x: number, y: number) => void;
  className?: string;
  loading?: boolean;
  showGridLines?: boolean;
}

const PixelGrid: React.FC<PixelGridProps> = ({
  width,
  height,
  pixels,
  editable = true,
  onPixelClick,
  className = '',
  loading = false,
  showGridLines = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [cellSize, setCellSize] = useState(25);

  useEffect(() => {
    const handleResize = () => {
      if (wrapperRef.current) {
        const { clientWidth, clientHeight } = wrapperRef.current;
        const aspectRatio = width / height;
        let newWidth = clientWidth;
        let newHeight = clientHeight;

        if (clientWidth / clientHeight > aspectRatio) {
          newWidth = clientHeight * aspectRatio;
        } else {
          newHeight = clientWidth / aspectRatio;
        }

        setCanvasSize({ width: newWidth, height: newHeight });
        setCellSize(Math.min(newWidth / width, newHeight / height));
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width, height]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Draw pixels
    pixels.forEach(pixel => {
      ctx.fillStyle = pixel.color;
      ctx.fillRect(pixel.x * cellSize, pixel.y * cellSize, cellSize, cellSize);
    });

    // Draw empty cells if showGridLines is true
    if (showGridLines) {
      ctx.fillStyle = '#f0f0f0'; // Light grey background for empty cells
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          const pixelExists = pixels.some(pixel => pixel.x === x && pixel.y === y);
          if (!pixelExists) {
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            ctx.strokeStyle = '#ccc';
            ctx.beginPath();
            ctx.moveTo(x * cellSize, y * cellSize);
            ctx.lineTo((x + 1) * cellSize, (y + 1) * cellSize);
            ctx.stroke();
          }
        }
      }
    }

    // Draw grid lines if showGridLines is true
    if (showGridLines) {
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 1;
      for (let x = 0; x <= width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cellSize, 0);
        ctx.lineTo(x * cellSize, height * cellSize);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellSize);
        ctx.lineTo(width * cellSize, y * cellSize);
        ctx.stroke();
      }
    }
  }, [pixels, cellSize, canvasSize, width, height, showGridLines]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !editable || loading) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);

    if (onPixelClick) {
      onPixelClick(x, y);
    }
  };

  return (
    <div ref={wrapperRef} className={`pixel-grid-wrapper ${className}`}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{
          border: '2px solid black',
          cursor: editable && !loading ? 'pointer' : 'not-allowed'
        }}
        onClick={handleCanvasClick}
      />
      {loading && (
        <div className="pixel-grid-loading-overlay">
          <div className="pixel-grid-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default PixelGrid;