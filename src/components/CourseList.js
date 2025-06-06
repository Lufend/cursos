import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom'; // Asegúrate de importar useParams
import CourseCard from './CourseCard';
import { AuthContext } from '../App';

function CourseList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { API_BASE_URL, user } = useContext(AuthContext);
  
  // 1. OBTENER EL PARÁMETRO DE LA URL
  // Esta línea es crucial. Obtiene el 'categoryId' de la URL si existe.
  const { categoryId } = useParams(); 

  useEffect(() => {
    // Para depurar, puedes ver qué valor tiene categoryId en la consola del navegador
    console.log(`El ID de categoría obtenido de la URL es: ${categoryId}`);

    const fetchCourses = async () => {
      if (!user) {
        // No hacer nada si no hay usuario, aunque la ruta debería proteger esto.
        return;
      }
      
      try {
        setLoading(true);
        setError('');

        // 2. CONSTRUIR LA URL CORRECTA
        // Si 'categoryId' tiene un valor, se añade el filtro a la URL.
        const url = categoryId 
            ? `${API_BASE_URL}/courses?category_id=${categoryId}` 
            : `${API_BASE_URL}/courses`;
        
        // Depuración adicional: ver la URL final que se va a llamar
        console.log(`Haciendo petición a la API con la URL: ${url}`);

        const response = await axios.get(url);
        setCourses(response.data);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError('No se pudieron cargar los cursos. Inténtalo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
    
    // 3. AÑADIR categoryId A LAS DEPENDENCIAS
    // Esto asegura que la petición se vuelva a hacer cada vez que cambies de categoría.
  }, [API_BASE_URL, user, categoryId]);

  if (loading) return <p>Cargando cursos...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div>
      <h2>Explora Nuestros Cursos</h2>
      {courses.length === 0 ? (
          <p>No hay cursos disponibles en esta categoría por el momento.</p>
      ) : (
        <div className="courses-grid">
          {courses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

export default CourseList;