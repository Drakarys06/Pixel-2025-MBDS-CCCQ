import React, { useState } from 'react';
import { Form, Input, Checkbox } from '../ui/FormComponents';
import Button from '../ui/Button';
import Card from '../ui/Card';
import '../../styles/features/CreateBoardForm.css';

export interface BoardFormData {
  title: string;
  length: number;
  width: number;
  time: number;
  redraw: boolean;
  creator: string;
  visitor: boolean;
}

interface CreateBoardFormProps {
  onSubmit: (data: BoardFormData) => Promise<void>;
  loading: boolean;
}

const CreateBoardForm: React.FC<CreateBoardFormProps> = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState<BoardFormData>({
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
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? parseInt(value, 10) : 
              value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Card className="create-board-form">
      <Card.Header>
        <h2 className="create-board-title">Create New Pixel Board</h2>
      </Card.Header>
      
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          <Input
            label="Board Title"
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            maxLength={100}
            placeholder="Enter a title for your board"
          />

          <div className="form-row">
            <Input
              label="Width"
              type="number"
              id="width"
              name="width"
              value={formData.width.toString()}
              onChange={handleChange}
              required
              min={1}
              max={1000}
            />

            <Input
              label="Height"
              type="number"
              id="length"
              name="length"
              value={formData.length.toString()}
              onChange={handleChange}
              required
              min={1}
              max={1000}
            />
          </div>

          <Input
            label="Time (minutes)"
            type="number"
            id="time"
            name="time"
            value={formData.time.toString()}
            onChange={handleChange}
            required
            min={0}
            placeholder="How long will the board be active?"
          />

          <Input
            label="Creator Name"
            type="text"
            id="creator"
            name="creator"
            value={formData.creator}
            onChange={handleChange}
            required
            placeholder="Your name or username"
          />

          <div className="form-checkboxes">
            <Checkbox
              label="Allow users to redraw over existing pixels"
              id="redraw"
              name="redraw"
              checked={formData.redraw}
              onChange={handleChange}
            />

            <Checkbox
              label="Enable visitor mode (view-only after time expires)"
              id="visitor"
              name="visitor"
              checked={formData.visitor}
              onChange={handleChange}
            />
          </div>

          <div className="form-actions">
            <Button 
              type="submit" 
              variant="primary" 
              disabled={loading} 
              fullWidth
            >
              {loading ? 'Creating...' : 'Create Pixel Board'}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default CreateBoardForm;