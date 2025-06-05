import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import CourseCard from './CourseCard'; 
import { AuthContext } from '../App';

function CourseList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { API_BASE_URL, user } = useContext(AuthContext);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) { // Si no hay usuario, no intentar cargar
        setError("Debes iniciar sesión para ver los cursos.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError('');
        const response = await axios.get(`${API_BASE_URL}/courses`);
        setCourses(response.data);
      } catch (err) {
        console.error("Error fetching courses:", err);
        if (err.response && err.response.status === 401) {
            setError("Tu sesión ha expirado o no estás autorizado. Por favor, inicia sesión de nuevo.");
            // Opcionalmente, podrías llamar a handleLogout() aquí.
        } else {
            setError('No se pudieron cargar los cursos. Inténtalo más tarde.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [API_BASE_URL, user]); // Dependencia de `user` para recargar si el usuario cambia

  if (loading) return <p>Cargando cursos...</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (courses.length === 0 && !loading) return <p>No hay cursos disponibles por el momento.</p>;


  return (
    <div>
      <h2>Explora Nuestros Cursos</h2>
      <div className="courses-grid">
        {courses.map(course => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
}

export default CourseList;