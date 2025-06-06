import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../App';

function AdminDashboard() {
  // Estados para Cursos
  const [courses, setCourses] = useState([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [courseError, setCourseError] = useState('');
  const [courseSuccessMessage, setCourseSuccessMessage] = useState('');
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [categories, setCategories] = useState([]);
  const [courseFormData, setCourseFormData] = useState({
        title: '',
        description: '',
        instructor: '',
        image_url: '',
        category_id: ''
    });

  // Estados para Lecciones
  const [lessons, setLessons] = useState([]);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);
  const [isEditingLesson, setIsEditingLesson] = useState(false);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [lessonFormData, setLessonFormData] = useState({
    title: '',
    video_url: '',
    description: '',
    order_index: 0
  });
  const [lessonError, setLessonError] = useState('');
  const [lessonSuccessMessage, setLessonSuccessMessage] = useState('');

  const { API_BASE_URL, user } = useContext(AuthContext);

  // --- Utilidad para mostrar mensajes ---
  const showMessage = (setter, message, isError = false, duration = 4000) => {
    setter(message);
    setTimeout(() => setter(''), duration);
  };

  // --- Funciones para Cursos ---
  const fetchCourses = async () => {
    setIsLoadingCourses(true);
    setCourseError('');
    try {
      const response = await axios.get(`${API_BASE_URL}/courses`);
      setCourses(response.data);
    } catch (err) {
      console.error("Error fetching courses for admin:", err);
      showMessage(setCourseError, 'Error al cargar los cursos.', true);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  // --- CÓDIGO CORREGIDO Y AÑADIDO ---

  // 1. useEffect para cargar los cursos al iniciar y cuando el usuario cambie.
  useEffect(() => {
    // Este efecto se ejecutará cuando el componente se monte
    // y también se volverá a ejecutar cada vez que el objeto 'user' cambie.
    if (user && user.is_admin) {
      fetchCourses();
    }
  }, [user]); // La dependencia 'user' es la clave para resolver el problema.

  // 2. useEffect para cargar las categorías.
  useEffect(() => {
    const fetchCategories = async () => {
        // Añadimos la condición 'if (user)' para que solo se ejecute si hay un usuario.
        if (user) {
            try {
                const response = await axios.get(`${API_BASE_URL}/categories`);
                setCategories(response.data);
            } catch (err) {
                console.error("Error fetching categories for admin:", err);
            }
        }
    };
    fetchCategories();
  }, [user, API_BASE_URL]); // Añadimos 'user' a las dependencias.

  // 3. Función de reseteo más completa.
  const resetCourseFormAndSelection = () => {
    setIsEditingCourse(false);
    setCurrentCourse(null);
    setCourseFormData({
        title: '',
        description: '',
        instructor: '',
        image_url: '',
        category_id: ''
    });
    setLessons([]); // También limpia las lecciones del curso que se estaba editando.
    resetLessonFormAndSelection(); // Y el formulario de lecciones.
  };  

  // --- FIN DEL CÓDIGO CORREGIDO ---


  const handleCourseInputChange = (e) => {
    const { name, value } = e.target;
    setCourseFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    setCourseError('');
    setCourseSuccessMessage('');

    if (!courseFormData.title || !courseFormData.description || !courseFormData.instructor || !courseFormData.category_id) {
      showMessage(setCourseError, 'Por favor, completa todos los campos requeridos, incluyendo la categoría.', true);
      return;
    }

    const url = isEditingCourse ? `${API_BASE_URL}/courses/${currentCourse.id}` : `${API_BASE_URL}/courses`;
    const method = isEditingCourse ? 'put' : 'post';

    try {
      const response = await axios[method](url, courseFormData);
      showMessage(setCourseSuccessMessage, response.data.message);
      fetchCourses(); // Se mantiene para refrescar la lista después de la acción.
      if (!isEditingCourse) {
          resetCourseFormAndSelection();
      } else {
          setCurrentCourse(prev => ({...prev, ...courseFormData}));
      }
    } catch (err) {
      console.error("Error saving course:", err.response);
      const errMsg = err.response?.data?.message || (isEditingCourse ? 'Error al actualizar el curso.' : 'Error al crear el curso.');
      showMessage(setCourseError, errMsg, true);
    }
  };

  const handleEditCourse = (course) => {
    setIsEditingCourse(true);
    setCurrentCourse(course);
    setCourseFormData({
      title: course.title,
      description: course.description,
      instructor: course.instructor,
      image_url: course.image_url || '', // Prevenir valor nulo en el input
      category_id: course.category_id || '' 
    });
    fetchLessonsForCourse(course.id);
    resetLessonFormAndSelection();
    setCourseError('');
    setCourseSuccessMessage('');
    window.scrollTo(0, 0);
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este curso? Todas sus lecciones también serán eliminadas.')) {
      setCourseError('');
      setCourseSuccessMessage('');
      try {
        const response = await axios.delete(`${API_BASE_URL}/courses/${courseId}`);
        showMessage(setCourseSuccessMessage, response.data.message);
        fetchCourses();
        if (currentCourse && currentCourse.id === courseId) {
            resetCourseFormAndSelection();
        }
      } catch (err) {
        console.error("Error deleting course:", err);
        const errMsg = err.response?.data?.message || 'Error al eliminar el curso.';
        showMessage(setCourseError, errMsg, true);
      }
    }
  };

  // --- Funciones para Lecciones ---
  const fetchLessonsForCourse = async (courseId) => {
    if (!courseId) {
      setLessons([]);
      return;
    }
    setIsLoadingLessons(true);
    setLessonError('');
    try {
      const response = await axios.get(`${API_BASE_URL}/courses/${courseId}/lessons`);
      setLessons(response.data.sort((a,b) => a.order_index - b.order_index));
    } catch (err) {
      console.error("Error fetching lessons:", err);
      showMessage(setLessonError, 'Error al cargar las lecciones del curso.', true);
      setLessons([]);
    } finally {
        setIsLoadingLessons(false);
    }
  };

  const handleLessonInputChange = (e) => {
    const { name, value, type } = e.target;
    setLessonFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value, 10) || 0 : value }));
  };

  const resetLessonFormAndSelection = () => {
    setLessonFormData({ title: '', video_url: '', description: '', order_index: 0 });
    setIsEditingLesson(false);
    setCurrentLesson(null);
    setLessonError('');
  };

  const handleLessonSubmit = async (e) => {
    e.preventDefault();
    setLessonError('');
    setLessonSuccessMessage('');

    if (!lessonFormData.title || !lessonFormData.video_url) {
      showMessage(setLessonError, 'El título y la URL del video son obligatorios para la lección.', true);
      return;
    }
    if (!currentCourse || !currentCourse.id) {
      showMessage(setLessonError, 'Error: No hay un curso seleccionado para asociar esta lección.', true);
      return;
    }

    const dataToSend = {
        ...lessonFormData,
        order_index: parseInt(lessonFormData.order_index, 10) || 0
    };

    const url = isEditingLesson
      ? `${API_BASE_URL}/lessons/${currentLesson.id}`
      : `${API_BASE_URL}/courses/${currentCourse.id}/lessons`;
    const method = isEditingLesson ? 'put' : 'post';

    try {
      const response = await axios[method](url, dataToSend);
      showMessage(setLessonSuccessMessage, response.data.message);
      fetchLessonsForCourse(currentCourse.id);
      resetLessonFormAndSelection();
    } catch (err) {
      console.error("Error saving lesson:", err.response);
      const errMsg = err.response?.data?.message || (isEditingLesson ? 'Error al actualizar la lección.' : 'Error al crear la lección.');
      showMessage(setLessonError, errMsg, true);
    }
  };

  const handleEditLesson = (lesson) => {
    setIsEditingLesson(true);
    setCurrentLesson(lesson);
    setLessonFormData({
      title: lesson.title,
      video_url: lesson.video_url,
      description: lesson.description || '',
      order_index: lesson.order_index || 0
    });
    setLessonError('');
    setLessonSuccessMessage('');
    const lessonFormElement = document.getElementById('lesson-form-anchor');
    if (lessonFormElement) {
        lessonFormElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta lección?')) {
      setLessonError('');
      setLessonSuccessMessage('');
      try {
        const response = await axios.delete(`${API_BASE_URL}/lessons/${lessonId}`);
        showMessage(setLessonSuccessMessage, response.data.message);
        fetchLessonsForCourse(currentCourse.id);
        if(currentLesson && currentLesson.id === lessonId){
            resetLessonFormAndSelection();
        }
      } catch (err) {
        console.error("Error deleting lesson:", err);
        const errMsg = err.response?.data?.message || 'Error al eliminar la lección.';
        showMessage(setLessonError, errMsg, true);
      }
    }
  };

  // --- Renderizado ---
  if (!user || !user.is_admin) {
    return <p>Acceso denegado. Esta sección es solo para administradores.</p>;
  }

  return (
    <div className="admin-dashboard">
      <h2>Panel de Administración</h2>
      
      {/* El resto del JSX no necesita cambios, ya que se basa en los estados que ahora se actualizan correctamente. */}

      {/* Formulario para Crear/Editar Curso */}
      <div className="admin-form">
        <h3>{isEditingCourse ? `Editando Curso: ${currentCourse?.title || ''}` : 'Crear Nuevo Curso'}</h3>
        {courseError && <p className="error-message">{courseError}</p>}
        {courseSuccessMessage && !courseError && <p className="success-message">{courseSuccessMessage}</p>}
        <form onSubmit={handleCourseSubmit}>
          <div>
            <label htmlFor="courseTitle">Título del Curso:</label>
            <input type="text" id="courseTitle" name="title" value={courseFormData.title} onChange={handleCourseInputChange} required />
          </div>
          <div>
            <label htmlFor="courseDescription">Descripción del Curso:</label>
            <textarea id="courseDescription" name="description" value={courseFormData.description} onChange={handleCourseInputChange} required />
          </div>
          <div>
            <label htmlFor="courseInstructor">Instructor del Curso:</label>
            <input type="text" id="courseInstructor" name="instructor" value={courseFormData.instructor} onChange={handleCourseInputChange} required />
          </div>
          <div>
            <label htmlFor="courseImageUrl">URL de la Imagen del Curso (opcional):</label>
            <input type="url" id="courseImageUrl" name="image_url" value={courseFormData.image_url} onChange={handleCourseInputChange} placeholder="https://ejemplo.com/imagen.jpg"/>
          </div>
          <div>
            <label htmlFor="courseCategory">Categoría del Curso:</label>
            <select
                id="courseCategory"
                name="category_id"
                value={courseFormData.category_id}
                onChange={handleCourseInputChange}
                required
            >
                <option value="" disabled>Selecciona una categoría</option>
                {categories.map(category => (
                    <option key={category.id} value={category.id}>
                        {category.name}
                    </option>
                ))}
            </select>
        </div>
        
        <button type="submit">{isEditingCourse ? 'Actualizar Curso' : 'Crear Curso'}</button>
        {isEditingCourse && <button type="button" className="cancel" onClick={resetCourseFormAndSelection}>Cancelar Edición</button>}
    </form>
      </div>

      {/* Sección de Lecciones (solo si se está editando un curso) */}
      {isEditingCourse && currentCourse && (
        <div className="admin-lessons-section admin-form" id="lesson-form-anchor">
          <h3>Gestionar Lecciones para: {currentCourse.title}</h3>
          {lessonError && <p className="error-message">{lessonError}</p>}
          {lessonSuccessMessage && !lessonError && <p className="success-message">{lessonSuccessMessage}</p>}

          <h4>{isEditingLesson ? `Editando Lección: ${currentLesson?.title || ''}` : 'Añadir Nueva Lección'}</h4>
          <form onSubmit={handleLessonSubmit}>
            <div>
              <label htmlFor="lessonTitle">Título de la Lección:</label>
              <input type="text" id="lessonTitle" name="title" value={lessonFormData.title} onChange={handleLessonInputChange} required />
            </div>
            <div>
              <label htmlFor="lessonVideoUrl">URL del Video:</label>
              <input type="url" id="lessonVideoUrl" name="video_url" value={lessonFormData.video_url} onChange={handleLessonInputChange} required placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."/>
            </div>
            <div>
              <label htmlFor="lessonDescription">Descripción de la Lección (opcional):</label>
              <textarea id="lessonDescription" name="description" value={lessonFormData.description} onChange={handleLessonInputChange} />
            </div>
            <div>
              <label htmlFor="lessonOrderIndex">Orden (ej. 1, 2, 3):</label>
              <input type="number" id="lessonOrderIndex" name="order_index" value={lessonFormData.order_index} onChange={handleLessonInputChange} min="0" />
            </div>
            <button type="submit">{isEditingLesson ? 'Actualizar Lección' : 'Añadir Lección'}</button>
            {isEditingLesson && <button type="button" className="cancel" onClick={resetLessonFormAndSelection}>Cancelar Edición de Lección</button>}
          </form>

          <h4>Lecciones Existentes en "{currentCourse.title}"</h4>
          {isLoadingLessons ? <p>Cargando lecciones...</p> : lessons.length > 0 ? (
            <div className="admin-course-list">
                <table className="admin-lessons-table">
                <thead>
                    <tr>
                    <th>Orden</th>
                    <th>Título</th>
                    <th>URL del Video</th>
                    <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {lessons.map(lesson => (
                    <tr key={lesson.id}>
                        <td>{lesson.order_index}</td>
                        <td>{lesson.title}</td>
                        <td><a href={lesson.video_url} target="_blank" rel="noopener noreferrer">Ver Video</a></td>
                        <td>
                        <button className="edit-btn" onClick={() => handleEditLesson(lesson)}>Editar</button>
                        <button className="delete-btn" onClick={() => handleDeleteLesson(lesson.id)}>Eliminar</button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
          ) : (
            <p>Este curso aún no tiene lecciones. ¡Añade algunas!</p>
          )}
        </div>
      )}

      {/* Lista de Cursos Existentes */}
      <div className="admin-course-list-container admin-form">
        <h3>Lista de Cursos Globales</h3>
        {isLoadingCourses ? <p>Cargando cursos...</p> : courses.length > 0 ? (
          <div className="admin-course-list">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Título</th>
                  <th>Instructor</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(course => (
                  <tr key={course.id}>
                    <td>{course.id}</td>
                    <td>{course.title}</td>
                    <td>{course.instructor}</td>
                    <td>
                      <button className="edit-btn" onClick={() => handleEditCourse(course)}>Editar Curso y Lecciones</button>
                      <button className="delete-btn" onClick={() => handleDeleteCourse(course.id)}>Eliminar Curso</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !isLoadingCourses && <p>No hay cursos creados todavía.</p>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
