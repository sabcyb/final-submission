import { useState } from 'react';
import './Note.css';

const COLORS = ['#ff8888', '#88ff88', '#8888ff', '#ffff99'];

export default function Note({ note, onUpdate, onDelete }) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ 
    x: note.positionX, 
    y: note.positionY 
  });

  const handleMouseDown = (e) => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
    
    setIsDragging(true);
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleMouseMove = (e) => {
      setPosition({
        x: e.clientX - startX,
        y: e.clientY - startY
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onUpdate(note.id, { positionX: position.x, positionY: position.y });
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div 
      className="note"
      style={{
        backgroundColor: note.color,
        width: `${note.width}px`,
        height: `${note.height}px`,
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'move'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="note-header">
        <input
          type="text"
          value={note.title}
          onChange={(e) => onUpdate(note.id, { title: e.target.value })}
          className="note-title"
        />
      </div>
      
      <textarea
        value={note.content}
        onChange={(e) => onUpdate(note.id, { content: e.target.value })}
        className="note-content"
        placeholder="Write your note here..."
      />
      
      <div className="note-footer">
        <div className="color-palette">
          {COLORS.map(color => (
            <button
              key={color}
              style={{ backgroundColor: color }}
              onClick={() => onUpdate(note.id, { color })}
              title={`Set color to ${color}`}
            />
          ))}
        </div>
        <button 
          className="delete-btn"
          onClick={() => onDelete(note.id)}
          title="Delete note"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}