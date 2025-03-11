import React, { useState } from 'react';

interface PixelBoardFormProps {
  onSubmit: (pixelBoardData: PixelBoardData) => void;
  loading: boolean;
}

export interface PixelBoardData {
  title: string;
  length: number;
  width: number;
  time: number;
  redraw: boolean;
  creator: string;
  visitor: boolean;
}

const PixelBoardForm: React.FC<PixelBoardFormProps> = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState<PixelBoardData>({
    title: '',
    length: 16,
    width: 16,
    time: 30,
    redraw: false,
    creator: '',
    visitor: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value, 10) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="board-form">
      <div className="form-group">
        <label htmlFor="title">Title:</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          maxLength={100}
        />
      </div>

      <div className="form-group">
        <label htmlFor="length">Length:</label>
        <input
          type="number"
          id="length"
          name="length"
          value={formData.length}
          onChange={handleChange}
          required
          min={1}
          max={1000}
        />
      </div>

      <div className="form-group">
        <label htmlFor="width">Width:</label>
        <input
          type="number"
          id="width"
          name="width"
          value={formData.width}
          onChange={handleChange}
          required
          min={1}
          max={1000}
        />
      </div>

      <div className="form-group">
        <label htmlFor="time">Time (minutes):</label>
        <input
          type="number"
          id="time"
          name="time"
          value={formData.time}
          onChange={handleChange}
          required
          min={0}
        />
      </div>

      <div className="form-group">
        <label htmlFor="creator">Creator:</label>
        <input
          type="text"
          id="creator"
          name="creator"
          value={formData.creator}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group checkbox">
        <label htmlFor="redraw">
          <input
            type="checkbox"
            id="redraw"
            name="redraw"
            checked={formData.redraw}
            onChange={handleChange}
          />
          Allow Redraw
        </label>
      </div>

      <div className="form-group checkbox">
        <label htmlFor="visitor">
          <input
            type="checkbox"
            id="visitor"
            name="visitor"
            checked={formData.visitor}
            onChange={handleChange}
          />
          Visitor Mode
        </label>
      </div>

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Creating...' : 'Create Pixel Board'}
      </button>
    </form>
  );
};

export default PixelBoardForm;