import React, { useState, useEffect, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';
import './CategoryBar.css'; // Crearemos este archivo CSS

function CategoryBar() {
    const [categories, setCategories] = useState([]);
    const { user, API_BASE_URL } = useContext(AuthContext);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/categories`);
                setCategories(response.data);
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };

        if (user) { // Solo cargar si el usuario está logueado
            fetchCategories();
        }
    }, [user, API_BASE_URL]);

    if (!user || categories.length === 0) {
        return null; // No mostrar la barra si no hay usuario o categorías
    }

    return (
        <nav className="category-bar">
            <NavLink to="/courses" end className={({ isActive }) => isActive ? "active-category-link" : "category-link"}>
                Todos
            </NavLink>
            {categories.map(category => (
                <NavLink 
                    key={category.id} 
                    to={`/courses/category/${category.id}`}
                    className={({ isActive }) => isActive ? "active-category-link" : "category-link"}
                >
                    {category.name}
                </NavLink>
            ))}
        </nav>
    );
}

export default CategoryBar;