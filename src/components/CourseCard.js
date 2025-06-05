import React from 'react';
import { Link } from 'react-router-dom'; // Importar Link


function CourseCard({ course }) {
  const defaultImage = "https://via.placeholder.com/300x180.png?text=Curso";

  return (
    <Link to={`/courses/${course.id}`} className="course-card-link"> {/* Envolver con Link */}
      <div className="course-card">
        <img
          src={course.image_url || defaultImage}
          alt={course.title}
          className="course-card-image"
          onError={(e) => { e.target.onerror = null; e.target.src=defaultImage; }}
        />
        <div className="course-card-content">
          <h3>{course.title}</h3>
          <p className="instructor">Por: {course.instructor}</p>
          <p className="description">{course.description}</p>
        </div>
      </div>
    </Link>
  );
}

export default CourseCard;