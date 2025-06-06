import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';
import ReactPlayer from 'react-player/lazy';

function CourseDetailView() {
  const { courseId } = useParams();
  const { user, API_BASE_URL } = useContext(AuthContext);
  
  const [lessons, setLessons] = useState([]);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isCompleted, setIsCompleted] = useState(false);
  const [completionId, setCompletionId] = useState(null);
  const [completionMessage, setCompletionMessage] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      setError("Debes iniciar sesión para ver los detalles del curso.");
      setLoading(false);
      return;
    }

    const fetchCourseData = async () => {
      setLoading(true);
      setError('');
      try {
        const lessonsResponse = await axios.get(`${API_BASE_URL}/courses/${courseId}/lessons`);
        setLessons(lessonsResponse.data);
        if (lessonsResponse.data.length > 0) {
          setCurrentVideoUrl(lessonsResponse.data[0].video_url);
        }

        const completionStatusResponse = await axios.get(`${API_BASE_URL}/courses/${courseId}/completion`);
        if (completionStatusResponse.data.isCompleted) {
          setIsCompleted(true);
          setCompletionId(completionStatusResponse.data.completionId);
        }

      } catch (err) {
        console.error("Error fetching course details:", err);
        setError('No se pudieron cargar los datos del curso.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [API_BASE_URL, user, courseId]);

  const handleMarkAsComplete = async () => {
    setCompletionMessage('');
    try {
      const response = await axios.post(`${API_BASE_URL}/courses/${courseId}/complete`);
      setIsCompleted(true);
      // CORREGIDO: Ahora siempre espera 'completionId' (camelCase)
      setCompletionId(response.data.completionId); 
      setCompletionMessage(response.data.message);
    } catch (error) {
      console.error("Error al marcar el curso como completo:", error);
      const message = error.response?.data?.message || 'Hubo un error al procesar tu solicitud.';
      setCompletionMessage(message);
    }
  };

  // --- FUNCIÓN DE NAVEGACIÓN CORREGIDA ---
  const handleViewCertificate = () => {
    // Depuración: Verifica qué valor tiene completionId antes de navegar
    console.log("Intentando navegar al certificado con ID:", completionId);
    
    // Solo navega si completionId es un valor válido (no null, no undefined, etc.)
    if (completionId) {
        navigate(`/certificate/${completionId}`);
    } else {
        console.error("No se puede navegar: completionId es nulo o inválido.");
        setCompletionMessage("Error: No se pudo encontrar el ID del certificado para navegar.");
    }
  };

  if (loading) return <p>Cargando detalles del curso...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="course-detail-container">
      <h2>Videos del Curso</h2>
      <div className="course-layout">
        <div className="video-player-area">
          {/* ... (código del reproductor y lista de lecciones, no cambia) ... */}
          {currentVideoUrl ? (
            <ReactPlayer
              url={currentVideoUrl}
              controls={true}
              width="100%"
              height="100%"
              onError={(e) => console.error('ReactPlayer Error:', e)}
            />
          ) : (
            lessons.length > 0 ? <p>Selecciona un video de la lista para reproducirlo.</p> : <p>Este curso aún no tiene videos.</p>
          )}
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

      <div className="course-completion-area">
        {completionMessage && <p className="completion-message">{completionMessage}</p>}
        
        {isCompleted ? (
            // CORREGIDO: El botón ahora llama a la nueva función de navegación
            <button onClick={handleViewCertificate} className="certificate-button">
                Ver mi Certificado
            </button>
        ) : (
            lessons.length > 0 && (
              <button onClick={handleMarkAsComplete} className="complete-button">
                  Marcar Curso como Completado
              </button>
            )
        )}
      </div>

      <Link to="/courses" className="back-to-courses-link">Volver a la lista de cursos</Link>
    </div>
  );
}

export default CourseDetailView;