import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';
import './CertificateView.css'; // Archivo CSS dedicado para el estilo del certificado

function CertificateView() {
    const { completionId } = useParams();
    const { user, API_BASE_URL } = useContext(AuthContext);
    const [certificateData, setCertificateData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCertificate = async () => {
            if (!user) return;
            try {
                const response = await axios.get(`${API_BASE_URL}/certificate/${completionId}`);
                setCertificateData(response.data);
            } catch (err) {
                console.error("Error fetching certificate data:", err);
                setError(err.response?.data?.message || 'No se pudo cargar el certificado.');
            } finally {
                setLoading(false);
            }
        };
        fetchCertificate();
    }, [completionId, user, API_BASE_URL]);

    if (loading) return <div>Cargando certificado...</div>;
    if (error) return <div className="error-message">{error} <Link to="/">Volver al inicio</Link></div>;
    if (!certificateData) return <div>No se encontraron datos del certificado.</div>;

    return (
        <div className="certificate-page">
            <div className="certificate-container">
                <div className="certificate-header">
                    <h1 className="main-title">Certificado de Finalización</h1>
                    <p className="subtitle">Este certificado se otorga a</p>
                </div>
                <div className="certificate-body">
                    <h2 className="student-name">{certificateData.username}</h2>
                    <p className="completion-text">Por haber completado exitosamente el curso</p>
                    <h3 className="course-title">"{certificateData.course_title}"</h3>
                    <p className="instructor-text">Instructor: {certificateData.instructor}</p>
                </div>
                <div className="certificate-footer">
                    <div className="date-section">
                        <p>{certificateData.completion_date}</p>
                        <hr />
                        <p>Fecha de Finalización</p>
                    </div>
                    <div className="signature-section">
                        <p>CursosOnline</p>
                        <hr />
                        <p>Plataforma Educativa</p>
                    </div>
                </div>
            </div>
            <button onClick={() => window.print()} className="print-button">
                Imprimir o Guardar como PDF
            </button>
        </div>
    );
}

export default CertificateView;