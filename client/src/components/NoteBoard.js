import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Note from './Note';
import './NoteBoard.css';

export default function NoteBoard({ token, onLogout }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const { data } = await axios.get('http://localhost:3001/api/notes', {
        headers: { Authorization: token }
      });
      setNotes(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching notes:', err);
    }
  };

  const createNote = async () => {
    try {
      const { data } = await axios.post('http://localhost:3001/api/notes', {
        title: 'New Note',
        content: '',
        positionX: Math.floor(Math.random() * 300),
        positionY: Math.floor(Math.random() * 100)
      }, {
        headers: { Authorization: token }
      });
      setNotes([...notes, data]);
    } catch (err) {
      console.error('Error creating note:', err);
    }
  };

  const updateNote = async (id, updates) => {
    try {
      await axios.put(`http://localhost:3001/api/notes/${id}`, updates, {
        headers: { Authorization: token }
      });
      setNotes(notes.map(note => note.id === id ? { ...note, ...updates } : note));
    } catch (err) {
      console.error('Error updating note:', err);
    }
  };

  const deleteNote = async (id) => {
    try {
      await axios.delete(`http://localhost:3001/api/notes/${id}`, {
        headers: { Authorization: token }
      });
      setNotes(notes.filter(note => note.id !== id));
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      onLogout();
      navigate('/login');
    }
  };

  if (loading) return <div className="loading">Loading notes...</div>;

  return (
    <div className="note-board-container">
      <div className="toolbar">
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
        <button onClick={createNote} className="add-note-btn">
          + Add Note
        </button>
      </div>
      <div className="note-board">
        {notes.map(note => (
          <Note 
            key={note.id} 
            note={note} 
            onUpdate={updateNote}
            onDelete={deleteNote}
          />
        ))}
      </div>
    </div>
  );
}