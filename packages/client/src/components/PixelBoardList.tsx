import React from 'react';

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

interface PixelBoardListProps {
  pixelBoards: PixelBoard[];
  loading: boolean;
  onDelete: (id: string) => void;
}

const PixelBoardList: React.FC<PixelBoardListProps> = ({ pixelBoards, loading, onDelete }) => {
  if (loading) {
    return <div className="loading">Loading pixel boards...</div>;
  }

  if (pixelBoards.length === 0) {
    return <div className="no-data">No pixel boards found. Create one to get started.</div>;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="pixel-board-list">
      <h2>Your Pixel Boards</h2>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Size</th>
            <th>Creator</th>
            <th>Created</th>
            <th>Settings</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pixelBoards.map((board) => (
            <tr key={board._id}>
              <td>{board.title}</td>
              <td>{board.width} x {board.length}</td>
              <td>{board.creator}</td>
              <td>{formatDate(board.creationTime)}</td>
              <td>
                <span>Time: {board.time} min</span><br />
                <span>Redraw: {board.redraw ? 'Yes' : 'No'}</span><br />
                <span>Visitor Mode: {board.visitor ? 'Yes' : 'No'}</span>
              </td>
              <td>
                <button onClick={() => onDelete(board._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PixelBoardList;