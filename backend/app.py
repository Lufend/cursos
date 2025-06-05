from flask import Flask, request, jsonify, session
from flask_mysqldb import MySQL
from flask_cors import CORS
from passlib.hash import sha256_crypt # Para hashear contraseñas
import os

app = Flask(__name__)
CORS(app, supports_credentials=True) # Habilitar CORS para todas las rutas y permitir credenciales

# --- Configuración de MySQL ---
app.config['MYSQL_HOST'] = 'localhost'  # Cambia si tu DB está en otro host
app.config['MYSQL_USER'] = 'root' # Cambia por tu usuario de MySQL
app.config['MYSQL_PASSWORD'] = 'luisfernando10' # Cambia por tu contraseña de MySQL
app.config['MYSQL_DB'] = 'cursos_online_db'
app.config['MYSQL_CURSORCLASS'] = 'DictCursor' # Para obtener resultados como diccionarios
app.secret_key = os.urandom(24) # Clave secreta para sesiones

mysql = MySQL(app)

# --- Rutas de Autenticación ---

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    is_admin = data.get('is_admin', False) # Por defecto, no es admin

    if not username or not password or not email:
        return jsonify({'message': 'Faltan campos requeridos'}), 400

    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM users WHERE username = %s OR email = %s", (username, email))
    existing_user = cur.fetchone()

    if existing_user:
        cur.close()
        return jsonify({'message': 'El nombre de usuario o email ya existen'}), 409

    hashed_password = sha256_crypt.hash(password)

    try:
        cur.execute(
            "INSERT INTO users (username, password, email, is_admin) VALUES (%s, %s, %s, %s)",
            (username, hashed_password, email, is_admin)
        )
        mysql.connection.commit()
        user_id = cur.lastrowid
        cur.close()
        return jsonify({'message': 'Usuario registrado exitosamente', 'user_id': user_id}), 201
    except Exception as e:
        mysql.connection.rollback()
        cur.close()
        return jsonify({'message': f'Error al registrar usuario: {str(e)}'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    identifier = data.get('identifier') # Puede ser username o email
    password = data.get('password')

    if not identifier or not password:
        return jsonify({'message': 'Faltan el identificador o la contraseña'}), 400

    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM users WHERE username = %s OR email = %s", (identifier, identifier))
    user = cur.fetchone()
    cur.close()

    if user and sha256_crypt.verify(password, user['password']):
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['is_admin'] = user['is_admin']
        return jsonify({
            'message': 'Inicio de sesión exitoso',
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'is_admin': user['is_admin']
            }
        }), 200
    else:
        return jsonify({'message': 'Credenciales inválidas'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    session.pop('username', None)
    session.pop('is_admin', None)
    return jsonify({'message': 'Cierre de sesión exitoso'}), 200

@app.route('/api/check_session', methods=['GET'])
def check_session():
    if 'user_id' in session:
        return jsonify({
            'logged_in': True,
            'user': {
                'id': session['user_id'],
                'username': session['username'],
                'is_admin': session.get('is_admin', False)
            }
        }), 200
    else:
        return jsonify({'logged_in': False}), 200

# --- Rutas de Cursos (Protegidas para Administradores) ---

def admin_required(f):
    @wraps(f) # Importa wraps from functools
    def decorated_function(*args, **kwargs):
        if 'is_admin' not in session or not session['is_admin']:
            return jsonify({'message': 'Acceso denegado: se requiere ser administrador'}), 403
        return f(*args, **kwargs)
    return decorated_function

# --- Rutas de Cursos ---

@app.route('/api/courses', methods=['POST'])
# @admin_required # Descomentar si se implementa Flask-Login o una mejor gestión de sesión para admin
def create_course():
    # Simplificado: Asumimos que la verificación de admin se hace en el frontend por ahora
    # En una app de producción, esto DEBE estar protegido en el backend.
    if 'user_id' not in session or not session.get('is_admin'):
         return jsonify({'message': 'Acceso denegado. Solo administradores pueden crear cursos.'}), 403

    data = request.get_json()
    title = data.get('title')
    description = data.get('description')
    instructor = data.get('instructor')
    image_url = data.get('image_url')

    if not title or not description or not instructor:
        return jsonify({'message': 'Título, descripción e instructor son requeridos'}), 400

    cur = mysql.connection.cursor()
    try:
        cur.execute(
            "INSERT INTO courses (title, description, instructor, image_url) VALUES (%s, %s, %s, %s)",
            (title, description, instructor, image_url)
        )
        mysql.connection.commit()
        course_id = cur.lastrowid
        cur.close()
        return jsonify({'message': 'Curso creado exitosamente', 'course_id': course_id}), 201
    except Exception as e:
        mysql.connection.rollback()
        cur.close()
        return jsonify({'message': f'Error al crear el curso: {str(e)}'}), 500

@app.route('/api/courses', methods=['GET'])
def get_courses():
    if 'user_id' not in session: # Solo usuarios logueados pueden ver cursos
        return jsonify({'message': 'Acceso denegado. Debes iniciar sesión.'}), 401

    cur = mysql.connection.cursor()
    cur.execute("SELECT id, title, description, instructor, image_url, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at FROM courses ORDER BY created_at DESC")
    courses = cur.fetchall()
    cur.close()
    return jsonify(courses), 200

@app.route('/api/courses/<int:course_id>', methods=['PUT'])
# @admin_required
def update_course(course_id):
    if 'user_id' not in session or not session.get('is_admin'):
         return jsonify({'message': 'Acceso denegado. Solo administradores pueden editar cursos.'}), 403

    data = request.get_json()
    title = data.get('title')
    description = data.get('description')
    instructor = data.get('instructor')
    image_url = data.get('image_url')

    if not all([title, description, instructor]):
        return jsonify({'message': 'Título, descripción e instructor son requeridos'}), 400

    cur = mysql.connection.cursor()
    try:
        cur.execute(
            "UPDATE courses SET title = %s, description = %s, instructor = %s, image_url = %s WHERE id = %s",
            (title, description, instructor, image_url, course_id)
        )
        mysql.connection.commit()
        if cur.rowcount == 0:
            cur.close()
            return jsonify({'message': 'Curso no encontrado'}), 404
        cur.close()
        return jsonify({'message': 'Curso actualizado exitosamente'}), 200
    except Exception as e:
        mysql.connection.rollback()
        cur.close()
        return jsonify({'message': f'Error al actualizar el curso: {str(e)}'}), 500


@app.route('/api/courses/<int:course_id>', methods=['DELETE'])
# @admin_required
def delete_course(course_id):
    if 'user_id' not in session or not session.get('is_admin'):
         return jsonify({'message': 'Acceso denegado. Solo administradores pueden eliminar cursos.'}), 403

    cur = mysql.connection.cursor()
    try:
        cur.execute("DELETE FROM courses WHERE id = %s", (course_id,))
        mysql.connection.commit()
        if cur.rowcount == 0:
            cur.close()
            return jsonify({'message': 'Curso no encontrado'}), 404
        cur.close()
        return jsonify({'message': 'Curso eliminado exitosamente'}), 200
    except Exception as e:
        mysql.connection.rollback()
        cur.close()
        return jsonify({'message': f'Error al eliminar el curso: {str(e)}'}), 500
    
   
@app.route('/api/courses/<int:course_id>/lessons', methods=['POST'])
def add_lesson_to_course(course_id):
    if 'user_id' not in session or not session.get('is_admin'):
        return jsonify({'message': 'Acceso denegado. Solo administradores pueden añadir lecciones.'}), 403

    data = request.get_json()
    title = data.get('title')
    video_url = data.get('video_url')
    description = data.get('description', '') # Descripción opcional
    order_index = data.get('order_index', 0)

    if not title or not video_url:
        return jsonify({'message': 'Título y URL del video son requeridos'}), 400

    cur = mysql.connection.cursor()
    try:
        # Verificar si el curso existe
        cur.execute("SELECT id FROM courses WHERE id = %s", (course_id,))
        if not cur.fetchone():
            cur.close()
            return jsonify({'message': 'Curso no encontrado'}), 404

        cur.execute(
            "INSERT INTO lessons (course_id, title, video_url, description, order_index) VALUES (%s, %s, %s, %s, %s)",
            (course_id, title, video_url, description, order_index)
        )
        mysql.connection.commit()
        lesson_id = cur.lastrowid
        cur.close()
        return jsonify({'message': 'Lección añadida exitosamente', 'lesson_id': lesson_id}), 201
    except Exception as e:
        mysql.connection.rollback()
        cur.close()
        app.logger.error(f"Error al añadir lección: {str(e)}")
        return jsonify({'message': f'Error al añadir la lección: {str(e)}'}), 500

# Endpoint para que cualquier usuario autenticado obtenga las lecciones de un curso
@app.route('/api/courses/<int:course_id>/lessons', methods=['GET'])
def get_lessons_for_course(course_id):
    if 'user_id' not in session:
        return jsonify({'message': 'Acceso denegado. Debes iniciar sesión.'}), 401

    cur = mysql.connection.cursor()
    # Verificar si el curso existe
    cur.execute("SELECT id FROM courses WHERE id = %s", (course_id,))
    if not cur.fetchone():
        cur.close()
        return jsonify({'message': 'Curso no encontrado'}), 404
    
    cur.execute("SELECT id, title, video_url, description, order_index, DATE_FORMAT(created_at, '%%Y-%%m-%%d %%H:%%i:%%s') as created_at FROM lessons WHERE course_id = %s ORDER BY order_index ASC, created_at ASC", (course_id,))
    lessons = cur.fetchall()
    cur.close()
    return jsonify(lessons), 200

# Endpoint para que el Administrador actualice una lección (video)
@app.route('/api/lessons/<int:lesson_id>', methods=['PUT'])
def update_lesson(lesson_id):
    if 'user_id' not in session or not session.get('is_admin'):
        return jsonify({'message': 'Acceso denegado. Solo administradores pueden editar lecciones.'}), 403

    data = request.get_json()
    title = data.get('title')
    video_url = data.get('video_url')
    description = data.get('description')
    order_index = data.get('order_index')

    if not title or not video_url: # Asumimos que al menos estos son requeridos
        return jsonify({'message': 'Título y URL del video son requeridos para la actualización'}), 400

    cur = mysql.connection.cursor()
    try:
        # Construir la consulta de actualización dinámicamente para los campos que se envían
        update_fields = []
        params = []
        if title is not None:
            update_fields.append("title = %s")
            params.append(title)
        if video_url is not None:
            update_fields.append("video_url = %s")
            params.append(video_url)
        if description is not None:
            update_fields.append("description = %s")
            params.append(description)
        if order_index is not None:
            update_fields.append("order_index = %s")
            params.append(order_index)
        
        if not update_fields:
            return jsonify({'message': 'No hay campos para actualizar'}), 400

        params.append(lesson_id)
        query = f"UPDATE lessons SET {', '.join(update_fields)} WHERE id = %s"
        
        cur.execute(query, tuple(params))
        mysql.connection.commit()

        if cur.rowcount == 0:
            cur.close()
            return jsonify({'message': 'Lección no encontrada o sin cambios'}), 404 # O 200 si no hay cambios es aceptable
        cur.close()
        return jsonify({'message': 'Lección actualizada exitosamente'}), 200
    except Exception as e:
        mysql.connection.rollback()
        cur.close()
        app.logger.error(f"Error al actualizar lección: {str(e)}")
        return jsonify({'message': f'Error al actualizar la lección: {str(e)}'}), 500

# Endpoint para que el Administrador elimine una lección (video)
@app.route('/api/lessons/<int:lesson_id>', methods=['DELETE'])
def delete_lesson(lesson_id):
    if 'user_id' not in session or not session.get('is_admin'):
        return jsonify({'message': 'Acceso denegado. Solo administradores pueden eliminar lecciones.'}), 403

    cur = mysql.connection.cursor()
    try:
        cur.execute("DELETE FROM lessons WHERE id = %s", (lesson_id,))
        mysql.connection.commit()
        if cur.rowcount == 0:
            cur.close()
            return jsonify({'message': 'Lección no encontrada'}), 404
        cur.close()
        return jsonify({'message': 'Lección eliminada exitosamente'}), 200
    except Exception as e:
        mysql.connection.rollback()
        cur.close()
        app.logger.error(f"Error al eliminar lección: {str(e)}")
        return jsonify({'message': f'Error al eliminar la lección: {str(e)}'}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5001) # Puerto diferente al de React