import React, { useState, useEffect, createContext } from 'react';
import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom'; // Asegúrate de importar Link
import axios from 'axios';

// Importaciones de componentes
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import CourseList from './components/CourseList';
import AdminDashboard from './components/AdminDashboard';
import CourseDetailView from './components/CourseDetailView';
import CertificateView from './components/CertificateView';
import CategoryBar from './components/CategoryBar';
import './App.css';

// Configuración de Axios
axios.defaults.withCredentials = true;
const API_BASE_URL = 'http://localhost:5001/api';

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
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkLoggedIn();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    navigate(userData.is_admin ? '/admin' : '/courses');
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/logout`);
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      setUser(null);
      navigate('/login');
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, setUser, API_BASE_URL, handleLogin, handleLogout }}>
      <Navbar />
      {user && <CategoryBar />}

      
      <div className="container">
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />

          {/* Rutas Protegidas */}
          <Route path="/courses" element={user ? <CourseList /> : <Navigate to="/login" />} />
          <Route path="/courses/category/:categoryId" element={user ? <CourseList /> : <Navigate to="/login" />} />
          <Route path="/courses/:courseId" element={user ? <CourseDetailView /> : <Navigate to="/login" />} />
          
          {/* ---- ESTA ES LA RUTA IMPORTANTE ---- */}
          <Route 
            path="/certificate/:completionId"
            element={user ? <CertificateView /> : <Navigate to="/login" />}
          />
          
          <Route path="/admin" element={user && user.is_admin ? <AdminDashboard /> : <Navigate to="/" />} />
          
          {/* Ruta Raíz y Fallback */}
          <Route path="/" element={<Navigate to={user ? (user.is_admin ? "/admin" : "/courses") : "/login"} />} />
          <Route path="*" element={<div>404 - Página No Encontrada</div>} />
        </Routes>
      </div>
    </AuthContext.Provider>
  );
}

// Nota: El componente App usa 'navigate', pero no puede estar dentro del contexto del
// Router que él mismo define. Por eso envolvemos <App /> en <BrowserRouter> en index.js.
// Esto es correcto y no necesita cambios.
export default App;