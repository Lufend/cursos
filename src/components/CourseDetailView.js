import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';
import ReactPlayer from 'react-player/lazy'; // Para un reproductor más versátil

function CourseDetailView() {
  const { courseId } = useParams();
  const { user, API_BASE_URL } = useContext(AuthContext);
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourseAndLessons = async () => {
      if (!user) {
        setError("Debes iniciar sesión para ver los detalles del curso.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError('');
        // Fetch course details (asumimos que tienes un endpoint para esto o lo ajustas)
        // Por ahora, nos enfocaremos en las lecciones. Podrías obtener el título del curso de otra forma.
        // const courseResponse = await axios.get(`${API_BASE_URL}/courses/${courseId}`);
        // setCourse(courseResponse.data); // Asumiendo que tienes un endpoint /api/courses/:id que devuelve el curso

        const lessonsResponse = await axios.get(`${API_BASE_URL}/courses/${courseId}/lessons`);
        setLessons(lessonsResponse.data);
        if (lessonsResponse.data.length > 0) {
          setCurrentVideoUrl(lessonsResponse.data[0].video_url); // Poner el primer video por defecto
        }
      } catch (err) {
        console.error("Error fetching course details or lessons:", err);
        setError('No se pudieron cargar los detalles del curso o las lecciones.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseAndLessons();
  }, [API_BASE_URL, user, courseId]);

  if (loading) return <p>Cargando detalles del curso...</p>;
  if (error) return <p className="error-message">{error}</p>;
  // if (!course) return <p className="error-message">Curso no encontrado.</p>; // Descomentar si cargas detalles del curso

  return (
    <div className="course-detail-container">
      {/* <h2>{course.title}</h2> */} {/* Descomentar si cargas detalles del curso */}
      <h2>Videos del Curso</h2>
      <div className="course-layout">
        <div className="video-player-area">
          {currentVideoUrl ? (
            <ReactPlayer
              url={currentVideoUrl}
              controls={true}
              width="100%"
              height="450px"
              onError={(e) => {
                console.error('ReactPlayer Error:', e);
                setError('Error al cargar el video. Asegúrate de que la URL es correcta y accesible.');
              }}
            />
          ) : (
            lessons.length > 0 && <p>Selecciona un video de la lista para reproducirlo.</p>
          )}
          {!currentVideoUrl && lessons.length === 0 && <p>Este curso aún no tiene videos.</p>}
        </div>
        <div className="lessons-list-area">
          <h3>Lecciones</h3>
          {lessons.length > 0 ? (
            <ul>
              {lessons.map(lesson => (
                <li
                  key={lesson.id}
                  onClick={() => setCurrentVideoUrl(lesson.video_url)}
                  className={currentVideoUrl === lesson.video_url ? 'active-lesson' : ''}
                >
                  {lesson.title}
                </li>
              ))}
            </ul>
          ) : (
            <p>No hay lecciones disponibles para este curso.</p>
          )}
        </div>
      </div>
      <Link to="/courses" className="back-to-courses-link">Volver a la lista de cursos</Link>
    </div>
  );
}

export default CourseDetailView;