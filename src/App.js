import React, { useState, useEffect, createContext } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register'; // Crearemos este componente
import CourseList from './components/CourseList';
import AdminDashboard from './components/AdminDashboard';
import CourseDetailView from './components/CourseDetailView'; // Nueva importación
import './App.css';

// Configura Axios para enviar credenciales (cookies) con cada solicitud
axios.defaults.withCredentials = true;
const API_BASE_URL = 'http://localhost:5001/api'; // URL de tu backend Flask

export const AuthContext = createContext();

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/check_session`);
        if (response.data.logged_in) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        setUser(null); // Asegurarse de que el usuario es null si hay error
      } finally {
        setLoading(false);
      }
    };
    checkLoggedIn();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    if (userData.is_admin) {
      navigate('/admin');
    } else {
      navigate('/courses');
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/logout`);
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error("Error logging out:", error);
      // Incluso si hay un error en el backend, limpiar el estado del usuario en el frontend
      setUser(null);
      navigate('/login');
    }
  };

  if (loading) {
    return <div>Cargando...</div>; // O un spinner más elegante
  }

  return (
    <AuthContext.Provider value={{ user, setUser, API_BASE_URL, handleLogin, handleLogout }}>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to={user.is_admin ? "/admin" : "/courses"} />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to={user.is_admin ? "/admin" : "/courses"} />} />

          <Route
          path="/courses"
          element={user ? <CourseList /> : <Navigate to="/login" />}
        />
        <Route
        path="/courses/:courseId" // Nueva ruta para detalles del curso
        element={user ? <CourseDetailView /> : <Navigate to="/login" />}
        />
        <Route
        path="/admin"
        element={user && user.is_admin ? <AdminDashboard /> : <Navigate to={user ? "/courses" : "/login"} />}
      />
          <Route path="/" element={<Navigate to={user ? (user.is_admin ? "/admin" : "/courses") : "/login"} />} />
          {/* Puedes añadir una ruta para 404 Not Found */}
          <Route path="*" element={<div>404 - Página No Encontrada</div>} />
        </Routes>
      </div>
    </AuthContext.Provider>
  );
}

export default App;