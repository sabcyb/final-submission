import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export default function Login({ setToken }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const address = "https://p20kpj74-3001.euw.devtunnels.ms/"

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(address+'api/admin/login', { 
        username, 
        password 
      });
      localStorage.setItem('token', data.token);
      setToken(data.token);
      navigate('/');
    } catch (err) {
      setError('Invalid admin credentials');
    }
  };

  return (
    <div className="login-container">
      <h2>Log In Page</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}