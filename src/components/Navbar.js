import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';

function Navbar() {
  const { user, handleLogout } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">CursosOnline</Link>
      <div className="nav-links">
        {user ? (
          <>
            <span>Hola, {user.username}!</span>
            {user.is_admin && <Link to="/admin">Admin Dashboard</Link>}
            <Link to="/courses">Cursos</Link>
            <button onClick={handleLogout} className="auth-button">Cerrar Sesión</button>
          </>
        ) : (
          <>
            <Link to="/login" className="auth-button">Iniciar Sesión</Link>
            <Link to="/register" className="auth-button primary">Registrarse</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;