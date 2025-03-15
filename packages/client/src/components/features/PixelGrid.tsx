import React, { useEffect, useRef, useState, useCallback } from 'react';
import PixelTooltip from '../ui/PixelTooltip';
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

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  content: string;
  width: number;
  height: number;
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
  const tooltipTimeoutRef = useRef<number | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [cellSize, setCellSize] = useState(25);
  const [tooltip, setTooltip] = useState<TooltipState>({ 
    visible: false, 
    x: 0, 
    y: 0, 
    content: '',
    width: 0,
    height: 0
  });

  // Extract pixel coordinate calculation to a reusable function
  const getPixelCoordinates = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return null;
    
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: Math.floor((e.clientX - rect.left) / cellSize),
      y: Math.floor((e.clientY - rect.top) / cellSize)
    };
  }, [cellSize]);

  // Handle canvas resizing
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
    return () => {
      window.removeEventListener('resize', handleResize);
      // Clear any remaining tooltip timeout when component unmounts
      if (tooltipTimeoutRef.current !== null) {
        window.clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, [width, height]);

  // Handle drawing the pixel grid
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

  // Handle tooltip size changes
  const handleTooltipSizeChange = useCallback((width: number, height: number) => {
    setTooltip(prev => ({
      ...prev,
      width,
      height
    }));
  }, []);

  // Clear tooltip timeout
  const clearTooltipTimeout = useCallback(() => {
    if (tooltipTimeoutRef.current !== null) {
      window.clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
  }, []);

  // Handle canvas click
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !editable || loading) return;
    
    const coords = getPixelCoordinates(e);
    if (coords && onPixelClick) {
      onPixelClick(coords.x, coords.y);
    }
  }, [getPixelCoordinates, editable, loading, onPixelClick]);

  // Handle mouse movement for tooltip
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    clearTooltipTimeout();
    
    const coords = getPixelCoordinates(e);
    if (!coords) return;
    
    const pixel = pixels.find(p => p.x === coords.x && p.y === coords.y);
    
    if (!pixel) {
      setTooltip(prev => ({ ...prev, visible: false }));
      return;
    }
    
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    };

    const tooltipContent = `(${pixel.x}, ${pixel.y})\ncolor: ${pixel.color}\n${formatDate(pixel.lastModifiedDate)}\nBy: ${pixel.modifiedBy.join(', ')}`;
    
    tooltipTimeoutRef.current = window.setTimeout(() => {
      setTooltip({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        content: tooltipContent,
        width: 0,
        height: 0
      });
    }, 300);
  }, [getPixelCoordinates, pixels, clearTooltipTimeout]);

  // Handle mouse leaving the canvas
  const handleCanvasMouseLeave = useCallback(() => {
    clearTooltipTimeout();
    setTooltip(prev => ({ ...prev, visible: false }));
  }, [clearTooltipTimeout]);

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
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={handleCanvasMouseLeave}
      />
      {loading && (
        <div className="pixel-grid-loading-overlay">
          <div className="pixel-grid-spinner"></div>
        </div>
      )}
      
      <PixelTooltip
        visible={tooltip.visible}
        content={tooltip.content}
        x={tooltip.x}
        y={tooltip.y}
        onSizeChange={handleTooltipSizeChange}
      />
    </div>
  );
};

export default PixelGrid;