from flask import Flask, render_template, request, jsonify, send_from_directory, redirect, url_for, flash, session
import os
import json
import pyodbc
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3

app = Flask(__name__, static_folder='assets', static_url_path='/assets')

# Configuración
app.config['SECRET_KEY'] = 'tu_clave_secreta_aqui'
app.config['UPLOAD_FOLDER'] = 'uploads'

# Crear directorio de uploads si no existe
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Función para conectar a la base de datos
def get_db_connection():
    try:
        server = 'DESKTOP-VAT773J'
        database = 'sway'  # Cambiado a la base de datos sway
        username = 'EmilianoLedesma'
        password = 'Emiliano1'
        
        connection_string = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password}'
        connection = pyodbc.connect(connection_string)
        return connection
    except Exception as e:
        print(f"Error de conexión: {e}")
        return None

# Datos simulados de especies (en una aplicación real, esto vendría de una base de datos)
especies_data = [
    {
        'id': 'tortuga-verde',
        'nombre': 'Tortuga Marina Verde',
        'nombre_cientifico': 'Chelonia mydas',
        'estado_conservacion': 'vulnerable',
        'habitat': 'costero',
        'tipo': 'reptiles',
        'region': 'global',
        'longitud': '1.5m',
        'esperanza_vida': '80 años',
        'ubicacion': 'Océanos tropicales',
        'descripcion': 'La tortuga verde es una de las especies de tortugas marinas más grandes. Su nombre proviene del color verdoso de su grasa, no de su caparazón. Actualmente se encuentra amenazada por la captura ilegal, pérdida de hábitat y contaminación marina.',
        'imagen': 'https://pixabay.com/photos/sea-turtle-diving-underwater-2547084/',
        'poblacion': 'Declinando',
        'amenazas': ['Captura ilegal', 'Pérdida de hábitat', 'Contaminación marina', 'Cambio climático']
    },
    {
        'id': 'ballena-azul',
        'nombre': 'Ballena Azul',
        'nombre_cientifico': 'Balaenoptera musculus',
        'estado_conservacion': 'peligro',
        'habitat': 'aguas-abiertas',
        'tipo': 'mamiferos',
        'region': 'global',
        'longitud': 'Hasta 30m',
        'esperanza_vida': '90 años',
        'ubicacion': 'Océanos globales',
        'descripcion': 'La ballena azul es el animal más grande que ha existido en la Tierra. Pueden pesar hasta 200 toneladas. Su población se redujo drásticamente debido a la caza comercial, y ahora están protegidas internacionalmente.',
        'imagen': 'https://pixabay.com/photos/whale-humpback-whale-animal-mammal-1984341/',
        'poblacion': 'Recuperándose lentamente',
        'amenazas': ['Colisiones con barcos', 'Ruido oceánico', 'Cambio climático', 'Enredamiento en redes']
    },
    {
        'id': 'coral-cuerno',
        'nombre': 'Coral Cuerno de Alce',
        'nombre_cientifico': 'Acropora palmata',
        'estado_conservacion': 'extincion-critica',
        'habitat': 'arrecife',
        'tipo': 'corales',
        'region': 'caribe',
        'temperatura': '23-29°C',
        'profundidad': '1-5m',
        'ubicacion': 'Mar Caribe',
        'descripcion': 'Este coral formador de arrecifes era abundante en el Caribe, pero ha sufrido un declive del 97% debido al cambio climático, enfermedades y contaminación. Es crucial para mantener la biodiversidad marina.',
        'imagen': 'https://pixabay.com/photos/coral-reef-underwater-sea-ocean-683851/',
        'poblacion': 'Declive crítico (97% perdido)',
        'amenazas': ['Cambio climático', 'Acidificación oceánica', 'Enfermedades', 'Contaminación']
    },
    {
        'id': 'delfin-mular',
        'nombre': 'Delfín Mular',
        'nombre_cientifico': 'Tursiops truncatus',
        'estado_conservacion': 'vulnerable',
        'habitat': 'aguas-abiertas',
        'tipo': 'mamiferos',
        'region': 'global',
        'longitud': '2-4m',
        'esperanza_vida': '40-60 años',
        'ubicacion': 'Global',
        'descripcion': 'Los delfines mulares son conocidos por su inteligencia y sociabilidad. Enfrentan amenazas por captura accidental en redes de pesca, pérdida de hábitat y contaminación marina.',
        'imagen': 'https://pixabay.com/photos/dolphin-underwater-water-1199592/',
        'poblacion': 'Estable en algunas regiones',
        'amenazas': ['Captura accidental', 'Pérdida de hábitat', 'Contaminación', 'Ruido oceánico']
    }
]

@app.route('/')
def index():
    """Página principal"""
    return render_template('index.html')

@app.route('/especies')
def especies():
    """Página del catálogo de especies"""
    return render_template('especies.html')

@app.route('/eventos')
def eventos():
    """Página de eventos"""
    return render_template('eventos.html')

@app.route('/biblioteca')
def biblioteca():
    """Página de biblioteca"""
    return render_template('biblioteca.html')

@app.route('/tienda')
def tienda():
    """Página de tienda"""
    return render_template('tienda.html')

@app.route('/mis-pedidos')
def mis_pedidos():
    """Página de pedidos del usuario"""
    return render_template('mis-pedidos.html')

@app.route('/payment')
def payment():
    """Página de pagos"""
    return render_template('payment.html')

@app.route('/toma-accion')
def toma_accion():
    """Página de toma de acción"""
    return render_template('toma-accion.html')

@app.route('/starter-page')
def starter_page():
    """Página de inicio básica"""
    return render_template('starter-page.html')

# API Endpoints para especies
@app.route('/api/especies')
def api_especies():
    """API para obtener todas las especies desde la base de datos"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        
        # Obtener parámetros de filtro
        habitat = request.args.get('habitat', '')
        conservation = request.args.get('conservation', '')
        tipo = request.args.get('type', '')
        search = request.args.get('search', '').lower()
        
        # Construir query SQL
        query = """
            SELECT e.id, e.nombre_comun, e.nombre_cientifico, e.descripcion, 
                   e.esperanza_vida, e.poblacion_estimada, e.imagen_url,
                   ec.nombre as estado_conservacion
            FROM Especies e
            LEFT JOIN EstadosConservacion ec ON e.id_estado_conservacion = ec.id
            WHERE 1=1
        """
        params = []
        
        if search:
            query += " AND (LOWER(e.nombre_comun) LIKE ? OR LOWER(e.nombre_cientifico) LIKE ?)"
            params.extend([f'%{search}%', f'%{search}%'])
        
        if conservation:
            query += " AND ec.nombre = ?"
            params.append(conservation)
        
        cursor.execute(query, params)
        especies = []
        
        for row in cursor.fetchall():
            especies.append({
                'id': str(row[0]),
                'nombre': row[1],
                'nombre_cientifico': row[2],
                'descripcion': row[3],
                'esperanza_vida': f"{row[4]} años" if row[4] else 'No disponible',
                'poblacion': str(row[5]) if row[5] else 'No disponible',
                'imagen': row[6],
                'estado_conservacion': map_conservation_status(row[7]),
                'habitat': 'aguas-abiertas',  # Por defecto, mejorar con joins
                'tipo': 'mamiferos',  # Por defecto, mejorar con joins
                'longitud': 'Variable',  # Agregar a la BD
                'ubicacion': 'Global'  # Agregar a la BD
            })
        
        conn.close()
        return jsonify({
            'especies': especies,
            'total': len(especies)
        })
        
    except Exception as e:
        print(f"Error en api_especies: {e}")
        return jsonify({'error': str(e)}), 500

def map_conservation_status(status):
    """Mapear estado de conservación a formato frontend"""
    mapping = {
        'Extinción Crítica': 'extincion-critica',
        'En Peligro': 'peligro',
        'Vulnerable': 'vulnerable',
        'Casi Amenazada': 'casi-amenazada',
        'Preocupación Menor': 'preocupacion-menor'
    }
    return mapping.get(status, 'vulnerable')

@app.route('/api/especies/<string:especie_id>')
def api_especie_detalle(especie_id):
    """API para obtener detalles de una especie específica"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        cursor.execute("""
            SELECT e.id, e.nombre_comun, e.nombre_cientifico, e.descripcion, 
                   e.esperanza_vida, e.poblacion_estimada, e.imagen_url,
                   ec.nombre as estado_conservacion
            FROM Especies e
            LEFT JOIN EstadosConservacion ec ON e.id_estado_conservacion = ec.id
            WHERE e.id = ?
        """, (especie_id,))
        
        row = cursor.fetchone()
        if not row:
            conn.close()
            return jsonify({'error': 'Especie no encontrada'}), 404
        
        # Obtener amenazas
        cursor.execute("""
            SELECT a.nombre 
            FROM EspeciesAmenazas ea
            JOIN Amenazas a ON ea.id_amenaza = a.id
            WHERE ea.id_especie = ?
        """, (especie_id,))
        amenazas = [row[0] for row in cursor.fetchall()]
        
        especie = {
            'id': str(row[0]),
            'nombre': row[1],
            'nombre_cientifico': row[2],
            'descripcion': row[3],
            'esperanza_vida': f"{row[4]} años" if row[4] else 'No disponible',
            'poblacion': str(row[5]) if row[5] else 'No disponible',
            'imagen': row[6],
            'estado_conservacion': map_conservation_status(row[7]),
            'amenazas': amenazas,
            'habitat': 'aguas-abiertas',
            'tipo': 'mamiferos',
            'longitud': 'Variable',
            'ubicacion': 'Global'
        }
        
        conn.close()
        return jsonify(especie)
        
    except Exception as e:
        print(f"Error en api_especie_detalle: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/reportar-avistamiento', methods=['POST'])
def reportar_avistamiento():
    """API para reportar avistamientos de especies"""
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['species_name', 'sighting_date', 'location', 'observer_name', 'observer_email']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'Campo requerido: {field}'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        
        # Buscar o crear usuario
        cursor.execute("SELECT id FROM Usuarios WHERE email = ?", (data['observer_email'],))
        user_row = cursor.fetchone()
        
        if user_row:
            user_id = user_row[0]
        else:
            # Crear nuevo usuario
            cursor.execute("""
                INSERT INTO Usuarios (nombre, email, fecha_registro, activo) 
                VALUES (?, ?, GETDATE(), 1)
            """, (data['observer_name'], data['observer_email']))
            user_id = cursor.lastrowid
        
        # Buscar especie por nombre
        cursor.execute("""
            SELECT id FROM Especies 
            WHERE nombre_comun LIKE ? OR nombre_cientifico LIKE ?
        """, (f"%{data['species_name']}%", f"%{data['species_name']}%"))
        
        species_row = cursor.fetchone()
        species_id = species_row[0] if species_row else None
        
        # Parsear coordenadas si existen
        lat, lng = None, None
        if data.get('coordinates'):
            try:
                coords = data['coordinates'].split(',')
                lat = float(coords[0].strip())
                lng = float(coords[1].strip())
            except:
                pass
        
        # Insertar avistamiento
        cursor.execute("""
            INSERT INTO Avistamientos (id_especie, fecha, latitud, longitud, notas, id_usuario)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (species_id, data['sighting_date'], lat, lng, data.get('description', ''), user_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Avistamiento reportado exitosamente'
        })
        
    except Exception as e:
        print(f"Error en reportar_avistamiento: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/newsletter', methods=['POST'])
def suscribir_newsletter():
    """API para suscribir al newsletter"""
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({'error': 'Email requerido'}), 400
        
        # Validar formato de email básico
        if '@' not in email or '.' not in email:
            return jsonify({'error': 'Email inválido'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        
        # Verificar si ya existe el usuario
        cursor.execute("SELECT id, suscrito_newsletter FROM Usuarios WHERE email = ?", (email,))
        user_row = cursor.fetchone()
        
        if user_row:
            if user_row[1]:  # Ya está suscrito
                conn.close()
                return jsonify({'message': 'Este email ya está suscrito al newsletter'}), 200
            else:
                # Actualizar suscripción
                cursor.execute("UPDATE Usuarios SET suscrito_newsletter = 1 WHERE email = ?", (email,))
        else:
            # Crear nuevo usuario suscrito
            cursor.execute("""
                INSERT INTO Usuarios (nombre, email, suscrito_newsletter, fecha_registro, activo) 
                VALUES ('Usuario Newsletter', ?, 1, GETDATE(), 1)
            """, (email,))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Suscripción exitosa al newsletter'
        })
        
    except Exception as e:
        print(f"Error en suscribir_newsletter: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/estadisticas')
def api_estadisticas():
    """API para obtener estadísticas generales"""
    return jsonify({
        'especies_catalogadas': 2847,
        'en_peligro': 456,
        'especies_protegidas': 1234,
        'descubiertas_este_ano': 89,
        'calidad_agua': 78,
        'biodiversidad': 65,
        'cobertura_corales': 45,
        'temperatura_oceanica': 72
    })

# =============================================
# ENDPOINTS DE TIENDA
# =============================================

@app.route('/api/productos')
def get_productos():
    """Obtener productos con filtros y paginación"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        # Parámetros de consulta
        categoria_id = request.args.get('categoria_id', type=int)
        busqueda = request.args.get('busqueda', '')
        pagina = request.args.get('pagina', 1, type=int)
        limite = request.args.get('limite', 6, type=int)
        ordenar = request.args.get('ordenar', 'fecha_agregado')
        
        # Construir consulta SQL
        base_query = """
            SELECT 
                p.id, p.nombre, p.descripcion, p.precio, p.stock,
                p.imagen_url, p.dimensiones, p.peso_gramos, p.es_sostenible,
                p.fecha_agregado, cp.nombre as categoria_nombre,
                m.nombre as material_nombre,
                COALESCE(r.calificacion_promedio, 0) as calificacion_promedio,
                COALESCE(r.total_reseñas, 0) as total_reseñas
            FROM Productos p
            LEFT JOIN CategoriasProducto cp ON p.id_categoria = cp.id
            LEFT JOIN Materiales m ON p.id_material = m.id
            LEFT JOIN (
                SELECT 
                    id_producto,
                    AVG(CAST(calificacion AS FLOAT)) as calificacion_promedio,
                    COUNT(id) as total_reseñas
                FROM ReseñasProducto
                GROUP BY id_producto
            ) r ON p.id = r.id_producto
            WHERE p.activo = 1
        """
        
        params = []
        
        # Filtros
        if categoria_id:
            base_query += " AND p.id_categoria = ?"
            params.append(categoria_id)
        
        if busqueda:
            base_query += " AND (p.nombre LIKE ? OR p.descripcion LIKE ?)"

            params.extend([f'%{busqueda}%', f'%{busqueda}%'])
        
        # No necesita GROUP BY ahora que usamos subconsulta
        # base_query += " GROUP BY p.id, p.nombre, p.precio, p.stock, p.imagen_url, p.dimensiones, p.peso_gramos, p.es_sostenible, p.fecha_agregado, cp.nombre, m.nombre"
        
        # Ordenamiento
        if ordenar == 'precio_asc':
            base_query += " ORDER BY p.precio ASC"
        elif ordenar == 'precio_desc':
            base_query += " ORDER BY p.precio DESC"
        elif ordenar == 'nombre':
            base_query += " ORDER BY p.nombre ASC"
        elif ordenar == 'popularidad':
            base_query += " ORDER BY total_reseñas DESC"
        else:
            base_query += " ORDER BY p.fecha_agregado DESC"
        
        # Paginación - SQL Server usa OFFSET y FETCH
        offset = (pagina - 1) * limite
        base_query += f" OFFSET {offset} ROWS FETCH NEXT {limite} ROWS ONLY"
        
        cursor = conn.cursor()
        cursor.execute(base_query, params)
        
        productos = []
        for row in cursor.fetchall():
            productos.append({
                'id': row.id,
                'name': row.nombre,
                'description': row.descripcion,
                'price': float(row.precio),
                'stock': row.stock,
                'image_url': row.imagen_url,
                'dimensions': row.dimensiones,
                'weight_grams': row.peso_gramos,
                'is_sustainable': bool(row.es_sostenible),
                'date_added': row.fecha_agregado.isoformat() if row.fecha_agregado else None,
                'category': row.categoria_nombre,
                'material': row.material_nombre,
                'average_rating': round(row.calificacion_promedio, 1),
                'total_reviews': row.total_reseñas
            })
        
        # Obtener total de productos para paginación
        count_query = """
            SELECT COUNT(*) as total
            FROM Productos p
            WHERE p.activo = 1
        """
        
        count_params = []
        if categoria_id:
            count_query += " AND p.id_categoria = ?"
            count_params.append(categoria_id)
        
        if busqueda:
            count_query += " AND (p.nombre LIKE ? OR p.descripcion LIKE ?)"

            count_params.extend([f'%{busqueda}%', f'%{busqueda}%'])
        
        cursor.execute(count_query, count_params)
        total_productos = cursor.fetchone().total
        
        conn.close()
        
        return jsonify({
            'success': True,
            'products': productos,
            'total': total_productos,
            'pagina': pagina,
            'limite': limite,
            'total_paginas': (total_productos + limite - 1) // limite
        })
    
    except Exception as e:
        import traceback
        print(f"Error en get_productos: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Error interno del servidor: {str(e)}'}), 500

@app.route('/api/producto/<int:producto_id>')
def get_producto_detalle(producto_id):
    """Obtener detalles completos de un producto"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                p.id, p.nombre, p.descripcion, p.precio, p.stock,
                p.imagen_url, p.dimensiones, p.peso_gramos, p.es_sostenible,
                p.fecha_agregado, cp.nombre as categoria_nombre,
                m.nombre as material_nombre,
                COALESCE(AVG(CAST(r.calificacion AS FLOAT)), 0) as calificacion_promedio,
                COUNT(r.id) as total_reseñas
            FROM Productos p
            LEFT JOIN CategoriasProducto cp ON p.id_categoria = cp.id
            LEFT JOIN Materiales m ON p.id_material = m.id
            LEFT JOIN ReseñasProducto r ON p.id = r.id_producto
            WHERE p.id = ? AND p.activo = 1
            GROUP BY p.id, p.nombre, p.descripcion, p.precio, p.stock, 
                     p.imagen_url, p.dimensiones, p.peso_gramos, p.es_sostenible, 
                     p.fecha_agregado, cp.nombre, m.nombre
        """, (producto_id,))
        
        row = cursor.fetchone()
        if not row:
            return jsonify({'error': 'Producto no encontrado'}), 404
        
        producto = {
            'id': row.id,
            'nombre': row.nombre,
            'descripcion': row.descripcion,
            'precio': float(row.precio),
            'stock': row.stock,
            'imagen_url': row.imagen_url,
            'dimensiones': row.dimensiones,
            'peso_gramos': row.peso_gramos,
            'es_sostenible': bool(row.es_sostenible),
            'fecha_agregado': row.fecha_agregado.isoformat() if row.fecha_agregado else None,
            'categoria': row.categoria_nombre,
            'material': row.material_nombre,
            'calificacion_promedio': round(row.calificacion_promedio, 1),
            'total_reseñas': row.total_reseñas
        }
        
        conn.close()
        return jsonify({'producto': producto})
    
    except Exception as e:
        print(f"Error en get_producto_detalle: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/reseñas/<int:producto_id>')
def get_reseñas_producto(producto_id):
    """Obtener reseñas de un producto"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                r.id, r.calificacion, r.comentario, r.fecha_reseña,
                u.nombre as usuario_nombre
            FROM ReseñasProducto r
            JOIN Usuarios u ON r.id_usuario = u.id
            WHERE r.id_producto = ?
            ORDER BY r.fecha_reseña DESC
        """, (producto_id,))
        
        reseñas = []
        for row in cursor.fetchall():
            reseñas.append({
                'id': row.id,
                'calificacion': row.calificacion,
                'comentario': row.comentario,
                'fecha_reseña': row.fecha_reseña.isoformat() if row.fecha_reseña else None,
                'usuario_nombre': row.usuario_nombre
            })
        
        conn.close()
        return jsonify({'reseñas': reseñas})
    
    except Exception as e:
        print(f"Error en get_reseñas_producto: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/materiales')
def get_materiales():
    """Obtener todos los materiales"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        cursor.execute("SELECT id, nombre FROM Materiales ORDER BY nombre")
        
        materiales = []
        for row in cursor.fetchall():
            materiales.append({
                'id': row.id,
                'nombre': row.nombre
            })
        
        conn.close()
        return jsonify({'materiales': materiales})
    
    except Exception as e:
        print(f"Error en get_materiales: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/impacto-sostenible')
def get_impacto_sostenible():
    """Obtener métricas de impacto sostenible"""
    try:
        conn = get_db_connection()
        if not conn:
            # Datos de fallback si no hay conexión
            return jsonify({
                'impacto': {
                    'agua_limpiada': '125,000L',
                    'corales_plantados': '3,847',
                    'familias_beneficiadas': '89',
                    'plastico_reciclado': '2.3 Ton'
                }
            })
        
        # Aquí podrías calcular las métricas reales basadas en las ventas
        # Por ahora, usar datos estáticos pero provenientes de la base
        cursor = conn.cursor()
        
        # Ejemplo de cálculo basado en ventas
        cursor.execute("""
            SELECT 
                COUNT(*) as total_pedidos,
                SUM(total) as total_ventas,
                COUNT(DISTINCT id_usuario) as usuarios_unicos
            FROM Pedidos 
            WHERE YEAR(fecha_pedido) = YEAR(GETDATE())
        """)
        
        row = cursor.fetchone()
        total_pedidos = row.total_pedidos or 0
        total_ventas = float(row.total_ventas or 0)
        usuarios_unicos = row.usuarios_unicos or 0
        
        # Calcular impacto basado en ventas (fórmulas ejemplo)
        agua_limpiada = int(total_ventas * 500)  # 500L por cada peso vendido
        corales_plantados = int(total_pedidos * 2)  # 2 corales por pedido
        familias_beneficiadas = int(usuarios_unicos * 0.5)  # 0.5 familias por usuario
        plastico_reciclado = round(total_ventas * 0.01, 1)  # 0.01 ton por peso vendido
        
        conn.close()
        
        return jsonify({
            'impacto': {
                'agua_limpiada': f'{agua_limpiada:,}L',
                'corales_plantados': f'{corales_plantados:,}',
                'familias_beneficiadas': f'{familias_beneficiadas}',
                'plastico_reciclado': f'{plastico_reciclado} Ton'
            }
        })
    
    except Exception as e:
        print(f"Error en get_impacto_sostenible: {e}")
        # Datos de fallback en caso de error
        return jsonify({
            'impacto': {
                'agua_limpiada': '125,000L',
                'corales_plantados': '3,847',
                'familias_beneficiadas': '89',
                'plastico_reciclado': '2.3 Ton'
            }
        })

# =============================================
# ENDPOINTS DE USUARIO
# =============================================


@app.route('/login')
def login_page():
    """Página de login"""
    return render_template('login.html')

@app.route('/register')
def register_page():
    """Página de registro"""
    return render_template('register.html')

@app.route('/api/user/login', methods=['POST'])
def user_login():
    """Iniciar sesión"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({
                'success': False,
                'message': 'Email y contraseña son requeridos'
            }), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'message': 'Error de conexión a la base de datos'
            }), 500
        
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, nombre, email, password_hash, telefono, activo
            FROM Usuarios
            WHERE email = ? AND activo = 1
        """, (email,))
        
        user = cursor.fetchone()
        conn.close()
        
        if user and user.password_hash == password:
            # Crear sesión
            session['user_id'] = user.id
            session['user_name'] = user.nombre
            session['user_email'] = user.email
            
            return jsonify({
                'success': True,
                'message': 'Login exitoso',
                'user': {
                    'id': user.id,
                    'nombre': user.nombre,
                    'email': user.email,
                    'telefono': user.telefono
                }
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Credenciales incorrectas'
            }), 401
            
    except Exception as e:
        import traceback
        print(f"Error en login: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500

@app.route('/api/user/register', methods=['POST'])
def user_register():
    """Registrar nuevo usuario"""
    try:
        data = request.get_json()
        nombre = data.get('nombre')
        email = data.get('email')
        password = data.get('password')
        telefono = data.get('telefono')
        fecha_nacimiento = data.get('fecha_nacimiento')
        newsletter = data.get('newsletter', False)
        
        print(f"Datos de registro recibidos: {data}")
        
        if not all([nombre, email, password]):
            return jsonify({
                'success': False,
                'message': 'Nombre, email y contraseña son requeridos'
            }), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'message': 'Error de conexión a la base de datos'
            }), 500
        
        cursor = conn.cursor()
        
        # Verificar si el email ya existe
        cursor.execute("SELECT id FROM Usuarios WHERE email = ?", (email,))
        if cursor.fetchone():
            conn.close()
            return jsonify({
                'success': False,
                'message': 'El email ya está registrado'
            }), 400
        
        # Crear el usuario sin hash (texto plano)
        cursor.execute("""
            INSERT INTO Usuarios (nombre, email, password_hash, telefono, fecha_nacimiento, suscrito_newsletter, activo, fecha_registro)
            VALUES (?, ?, ?, ?, ?, ?, 1, GETDATE())
        """, (nombre, email, password, telefono, fecha_nacimiento, newsletter))
        
        conn.commit()
        
        # Obtener el ID del usuario creado
        cursor.execute("SELECT @@IDENTITY")
        user_id = cursor.fetchone()[0]
        
        conn.close()
        
        # Crear sesión automáticamente
        session['user_id'] = user_id
        session['user_name'] = nombre
        session['user_email'] = email
        
        return jsonify({
            'success': True,
            'message': 'Registro exitoso',
            'user': {
                'id': user_id,
                'nombre': nombre,
                'email': email,
                'telefono': telefono
            }
        })
        
    except Exception as e:
        import traceback
        print(f"Error en registro: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500

@app.route('/api/user/logout', methods=['POST'])
def logout():
    """Cerrar sesión del usuario"""
    try:
        session.clear()
        return jsonify({'success': True, 'message': 'Sesión cerrada exitosamente'})
    except Exception as e:
        print(f"Error en logout: {e}")
        return jsonify({'success': False, 'error': 'Error al cerrar sesión'}), 500

@app.route('/api/user/status')
def user_status():
    """Verificar estado de sesión"""
    try:
        if 'user_id' in session:
            # Obtener información completa del usuario desde la base de datos
            conn = get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT id, nombre, email, telefono, fecha_registro, fecha_nacimiento
                FROM Usuarios 
                WHERE id = ?
            """, (session['user_id'],))
            
            user = cursor.fetchone()
            conn.close()
            
            if user:
                return jsonify({
                    'success': True,
                    'user': {
                        'id': user[0],
                        'nombre': user[1],
                        'email': user[2],
                        'telefono': user[3],
                        'fecha_registro': user[4].isoformat() if user[4] else None,
                        'fecha_nacimiento': user[5].isoformat() if user[5] else None
                    }
                })
            else:
                # Usuario no encontrado en la base de datos, limpiar sesión
                session.clear()
                return jsonify({
                    'success': False,
                    'message': 'Usuario no encontrado'
                }), 401
        else:
            return jsonify({
                'success': False,
                'message': 'No hay sesión activa'
            }), 401
    except Exception as e:
        print(f"Error en user_status: {e}")
        return jsonify({
            'success': False,
            'message': 'Error al verificar sesión'
        }), 500

@app.route('/test_dropdown.html')
def test_dropdown():
    """Página de prueba del dropdown"""
    return send_from_directory('.', 'test_dropdown.html')

# Manejo de errores
@app.errorhandler(404)
def not_found(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('500.html'), 500

# Endpoint para crear productos de ejemplo (solo para desarrollo)
@app.route('/api/setup-tienda', methods=['POST'])
def setup_tienda():
    """Crear datos de ejemplo para la tienda"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        
        # Crear categorías de ejemplo
        categorias_ejemplo = [
            ('Ropa Sostenible', 'Prendas fabricadas con materiales ecológicos'),
            ('Accesorios Ecológicos', 'Productos útiles hechos con materiales reciclados'),
            ('Educativos', 'Materiales educativos sobre conservación marina'),
            ('Hogar Sustentable', 'Productos para el hogar que respetan el medio ambiente'),
            ('Juguetes Ecológicos', 'Juguetes fabricados con materiales naturales')
        ]
        
        for nombre, descripcion in categorias_ejemplo:
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM CategoriasProducto WHERE nombre = ?)
                INSERT INTO CategoriasProducto (nombre, descripcion) VALUES (?, ?)
            """, (nombre, nombre, descripcion))
        
        # Crear materiales de ejemplo
        materiales_ejemplo = [
            'Algodón Orgánico', 'Plástico Reciclado', 'Bambú', 'Madera Certificada', 
            'Acero Inoxidable', 'Vidrio Reciclado', 'Materiales Naturales'
        ]
        
        for material in materiales_ejemplo:
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM Materiales WHERE nombre = ?)
                INSERT INTO Materiales (nombre) VALUES (?)
            """, (material, material))
        
        # Crear productos de ejemplo
        productos_ejemplo = [
            ('Peluche Tortuga Marina', 'Adorable peluche de tortuga marina hecho con materiales 100% reciclados.', 24.99, 1, 50, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 2, '25x20x15 cm', 300),
            ('Termo Océano Azul 500ml', 'Termo de acero inoxidable con diseño oceánico, mantiene temperatura 12 horas.', 34.99, 2, 30, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', 5, '22x7x7 cm', 450),
            ('Set de Pines Vida Marina', 'Colección de 6 pines esmaltados con especies marinas icónicas.', 15.99, 2, 100, 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400', 3, '8x6x2 cm', 50),
            ('Camiseta Salva las Ballenas', 'Camiseta 100% algodón orgánico con estampado de ballena jorobada.', 28.99, 1, 25, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', 1, 'Varias tallas', 200),
            ('Bolsa Reutilizable Coral', 'Bolsa eco-friendly resistente con diseño de arrecife de coral.', 12.99, 2, 75, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', 2, '40x35x10 cm', 150),
            ('Pack Stickers Océano Limpio', '25 stickers impermeables con mensajes de conservación marina.', 9.99, 3, 200, 'https://images.unsplash.com/photo-1586510419923-3dde510e6cd9?w=400', 2, '15x10x1 cm', 25)
        ]
        
        for nombre, desc, precio, cat_id, stock, img, mat_id, dim, peso in productos_ejemplo:
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM Productos WHERE nombre = ?)
                INSERT INTO Productos (nombre, descripcion, precio, id_categoria, stock, imagen_url, id_material, dimensiones, peso_gramos, es_sostenible, activo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
            """, (nombre, nombre, desc, precio, cat_id, stock, img, mat_id, dim, peso))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Tienda configurada con productos de ejemplo'})
    
    except Exception as e:
        print(f"Error en setup_tienda: {e}")
        return jsonify({'error': str(e)}), 500

# =============================================
# ENDPOINTS PARA CARRITO FUNCIONAL
# =============================================

@app.route('/api/auth/register', methods=['POST'])
def auth_register():
    """Registrar nuevo usuario"""
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['nombre', 'email', 'password', 'telefono']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'El campo {field} es requerido'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        
        # Verificar si el email ya existe
        cursor.execute("SELECT id FROM Usuarios WHERE email = ?", (data['email'],))
        if cursor.fetchone():
            return jsonify({'error': 'El email ya está registrado'}), 400
        
        # Insertar nuevo usuario
        cursor.execute("""
            INSERT INTO Usuarios (nombre, email, password_hash, telefono, fecha_nacimiento, suscrito_newsletter)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            data['nombre'],
            data['email'],
            data['password'],  # En proyecto real se haría hash
            data['telefono'],
            data.get('fecha_nacimiento'),
            data.get('newsletter', False)
        ))
        
        conn.commit()
        
        # Obtener el ID del usuario creado
        cursor.execute("SELECT @@IDENTITY")
        user_id = cursor.fetchone()[0]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Usuario registrado exitosamente',
            'user_id': user_id
        })
        
    except Exception as e:
        print(f"Error en register: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    """Iniciar sesión"""
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email y contraseña son requeridos'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        
        # Buscar usuario
        cursor.execute("""
            SELECT id, nombre, email, telefono, activo 
            FROM Usuarios 
            WHERE email = ? AND password_hash = ?
        """, (data['email'], data['password']))
        
        user = cursor.fetchone()
        
        if not user or not user.activo:
            return jsonify({'error': 'Credenciales inválidas'}), 401
        
        conn.close()
        
        return jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'nombre': user.nombre,
                'email': user.email,
                'telefono': user.telefono
            }
        })
        
    except Exception as e:
        print(f"Error en login: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/carrito/agregar', methods=['POST'])
def agregar_al_carrito():
    """Agregar producto al carrito (usando localStorage del frontend)"""
    try:
        data = request.get_json()
        
        if not data.get('producto_id') or not data.get('cantidad'):
            return jsonify({'error': 'ID de producto y cantidad son requeridos'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        
        # Verificar que el producto existe y hay stock suficiente
        cursor.execute("""
            SELECT id, nombre, precio, stock, activo 
            FROM Productos 
            WHERE id = ?
        """, (data['producto_id'],))
        
        producto = cursor.fetchone()
        
        if not producto or not producto.activo:
            return jsonify({'error': 'Producto no encontrado'}), 404
        
        if producto.stock < int(data['cantidad']):
            return jsonify({'error': 'Stock insuficiente'}), 400
        
        conn.close()
        
        return jsonify({
            'success': True,
            'producto': {
                'id': producto.id,
                'nombre': producto.nombre,
                'precio': float(producto.precio),
                'stock': producto.stock
            }
        })
        
    except Exception as e:
        print(f"Error en agregar_al_carrito: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/direcciones/estados')
def get_estados():
    """Obtener lista de estados"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT id, nombre FROM Estados ORDER BY nombre")
        
        estados = []
        for row in cursor.fetchall():
            estados.append({
                'id': row.id,
                'nombre': row.nombre
            })
        
        conn.close()
        return jsonify({'estados': estados})
        
    except Exception as e:
        print(f"Error en get_estados: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/direcciones/municipios/<int:estado_id>')
def get_municipios(estado_id):
    """Obtener municipios por estado"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, nombre 
            FROM Municipios 
            WHERE id_estado = ? 
            ORDER BY nombre
        """, (estado_id,))
        
        municipios = []
        for row in cursor.fetchall():
            municipios.append({
                'id': row.id,
                'nombre': row.nombre
            })
        
        conn.close()
        return jsonify({'municipios': municipios})
        
    except Exception as e:
        print(f"Error en get_municipios: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/direcciones/colonias/<int:municipio_id>')
def get_colonias(municipio_id):
    """Obtener colonias por municipio"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, nombre, cp 
            FROM Colonias 
            WHERE id_municipio = ? 
            ORDER BY nombre
        """, (municipio_id,))
        
        colonias = []
        for row in cursor.fetchall():
            colonias.append({
                'id': row.id,
                'nombre': row.nombre,
                'cp': row.cp
            })
        
        conn.close()
        return jsonify({'colonias': colonias})
        
    except Exception as e:
        print(f"Error en get_colonias: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/direcciones/calles/<int:colonia_id>')
def get_calles(colonia_id):
    """Obtener calles por colonia"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, nombre 
            FROM Calles 
            WHERE id_colonia = ? 
            ORDER BY nombre
        """, (colonia_id,))
        
        calles = []
        for row in cursor.fetchall():
            calles.append({
                'id': row.id,
                'nombre': row.nombre
            })
        
        conn.close()
        return jsonify({'calles': calles})
        
    except Exception as e:
        print(f"Error en get_calles: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/pedidos/crear', methods=['POST'])
def crear_pedido():
    """Crear nuevo pedido"""
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['user_id', 'productos', 'direccion', 'pago']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'El campo {field} es requerido'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        
        # 1. Crear o buscar dirección
        direccion_data = data['direccion']
        
        # Crear dirección si no existe
        cursor.execute("""
            INSERT INTO Direcciones (id_calle, id_usuario, nombre_destinatario, telefono_contacto)
            VALUES (?, ?, ?, ?)
        """, (
            direccion_data['id_calle'],
            data['user_id'],
            direccion_data['nombre_destinatario'],
            direccion_data['telefono_contacto']
        ))
        
        cursor.execute("SELECT @@IDENTITY")
        direccion_id = cursor.fetchone()[0]
        
        # 2. Calcular total del pedido
        total = 0
        productos = data['productos']
        
        for item in productos:
            cursor.execute("SELECT precio FROM Productos WHERE id = ?", (item['id'],))
            producto = cursor.fetchone()
            if producto:
                # El frontend envía 'quantity', no 'cantidad'
                cantidad = int(item.get('quantity', item.get('cantidad', 1)))
                total += float(producto.precio) * cantidad
        
        # 3. Crear pedido
        cursor.execute("""
            INSERT INTO Pedidos (id_usuario, total, id_estatus, id_direccion, telefono_contacto)
            VALUES (?, ?, 1, ?, ?)
        """, (
            data['user_id'],
            total,
            direccion_id,
            direccion_data['telefono_contacto']
        ))
        
        cursor.execute("SELECT @@IDENTITY")
        pedido_id = cursor.fetchone()[0]
        
        # 4. Crear detalles del pedido
        for item in productos:
            cursor.execute("SELECT precio FROM Productos WHERE id = ?", (item['id'],))
            producto = cursor.fetchone()
            if producto:
                precio_unitario = float(producto.precio)
                # El frontend envía 'quantity', no 'cantidad'
                cantidad = int(item.get('quantity', item.get('cantidad', 1)))
                subtotal = precio_unitario * cantidad
                
                cursor.execute("""
                    INSERT INTO DetallesPedido (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
                    VALUES (?, ?, ?, ?, ?)
                """, (pedido_id, item['id'], cantidad, precio_unitario, subtotal))
        
        # 5. Procesar pago
        pago_data = data['pago']
        cursor.execute("""
            INSERT INTO PagosPedidos (id_pedido, numero_tarjeta, fecha_expiracion, cvv, nombre_tarjeta, id_tipoTarjeta, monto, id_estatus)
            VALUES (?, ?, ?, ?, ?, ?, ?, 3)
        """, (
            pedido_id,
            pago_data['numero_tarjeta'],
            pago_data['fecha_expiracion'],
            pago_data['cvv'],
            pago_data['nombre_tarjeta'],
            pago_data['tipo_tarjeta'],
            total
        ))
        
        # 6. Actualizar stock de productos
        for item in productos:
            # El frontend envía 'quantity', no 'cantidad'
            cantidad = int(item.get('quantity', item.get('cantidad', 1)))
            cursor.execute("""
                UPDATE Productos 
                SET stock = stock - ? 
                WHERE id = ?
            """, (cantidad, item['id']))
        
        # 7. Actualizar estatus del pedido a "Pagado"
        cursor.execute("UPDATE Pedidos SET id_estatus = 3 WHERE id = ?", (pedido_id,))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'pedido_id': pedido_id,
            'total': total,
            'message': 'Pedido creado exitosamente'
        })
        
    except Exception as e:
        import traceback
        print(f"Error en crear_pedido: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Error interno del servidor: {str(e)}'}), 500

@app.route('/api/pedidos/usuario/<int:user_id>')
def get_pedidos_usuario(user_id):
    """Obtener pedidos de un usuario"""
    try:
        # Verificar que el usuario esté autenticado y sea el mismo que solicita los pedidos
        if 'user_id' not in session:
            return jsonify({'error': 'Usuario no autenticado'}), 401
        
        if session['user_id'] != user_id:
            return jsonify({'error': 'No autorizado para ver estos pedidos'}), 403
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        cursor.execute("""
            SELECT p.id, p.fecha_pedido, p.total, e.nombre as estatus
            FROM Pedidos p
            JOIN Estatus e ON p.id_estatus = e.id
            WHERE p.id_usuario = ?
            ORDER BY p.fecha_pedido DESC
        """, (user_id,))
        
        pedidos = []
        for row in cursor.fetchall():
            pedidos.append({
                'id': row.id,
                'fecha_pedido': row.fecha_pedido.isoformat() if row.fecha_pedido else None,
                'total': float(row.total),
                'estatus': row.estatus
            })
        
        conn.close()
        return jsonify({'pedidos': pedidos})
        
    except Exception as e:
        print(f"Error en get_pedidos_usuario: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/pedidos/mis-pedidos')
def get_mis_pedidos():
    """Obtener pedidos del usuario autenticado"""
    try:
        # Verificar que el usuario esté autenticado
        if 'user_id' not in session:
            return jsonify({'error': 'Usuario no autenticado'}), 401
        
        user_id = session['user_id']
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        cursor.execute("""
            SELECT p.id, p.fecha_pedido, p.total, e.nombre as estatus
            FROM Pedidos p
            JOIN Estatus e ON p.id_estatus = e.id
            WHERE p.id_usuario = ?
            ORDER BY p.fecha_pedido DESC
        """, (user_id,))
        
        pedidos = []
        for row in cursor.fetchall():
            pedidos.append({
                'id': row.id,
                'fecha_pedido': row.fecha_pedido.isoformat() if row.fecha_pedido else None,
                'total': float(row.total),
                'estatus': row.estatus
            })
        
        conn.close()
        return jsonify({'pedidos': pedidos})
        
    except Exception as e:
        print(f"Error en get_mis_pedidos: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/tipos-tarjeta')
def get_tipos_tarjeta():
    """Obtener tipos de tarjeta disponibles"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        cursor.execute("SELECT id, nombre FROM TiposTarjeta ORDER BY nombre")
        
        tipos = []
        for row in cursor.fetchall():
            tipos.append({
                'id': row.id,
                'nombre': row.nombre
            })
        
        conn.close()
        return jsonify({'tipos_tarjeta': tipos})
        
    except Exception as e:
        print(f"Error en get_tipos_tarjeta: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/pedidos/detalle/<int:pedido_id>')
def get_pedido_detalle(pedido_id):
    """Obtener detalles completos de un pedido"""
    try:
        # Verificar que el usuario esté autenticado
        if 'user_id' not in session:
            return jsonify({'error': 'Usuario no autenticado'}), 401
        
        user_id = session['user_id']
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        
        # Verificar que el pedido pertenece al usuario autenticado
        cursor.execute("SELECT id_usuario FROM Pedidos WHERE id = ?", (pedido_id,))
        pedido_owner = cursor.fetchone()
        
        if not pedido_owner or pedido_owner.id_usuario != user_id:
            return jsonify({'error': 'No autorizado para ver este pedido'}), 403
        
        # Obtener información del pedido
        cursor.execute("""
            SELECT p.id, p.fecha_pedido, p.total, e.nombre as estatus, p.telefono_contacto,
                   CONCAT(ca.nombre, ', ', co.nombre, ', ', m.nombre, ', ', es.nombre) as direccion_completa
            FROM Pedidos p
            JOIN Estatus e ON p.id_estatus = e.id
            LEFT JOIN Direcciones d ON p.id_direccion = d.id
            LEFT JOIN Calles ca ON d.id_calle = ca.id
            LEFT JOIN Colonias co ON ca.id_colonia = co.id
            LEFT JOIN Municipios m ON co.id_municipio = m.id
            LEFT JOIN Estados es ON m.id_estado = es.id
            WHERE p.id = ?
        """, (pedido_id,))
        
        pedido_row = cursor.fetchone()
        if not pedido_row:
            return jsonify({'error': 'Pedido no encontrado'}), 404
        
        # Obtener detalles del pedido
        cursor.execute("""
            SELECT dp.cantidad, dp.precio_unitario, dp.subtotal, pr.nombre as producto_nombre
            FROM DetallesPedido dp
            JOIN Productos pr ON dp.id_producto = pr.id
            WHERE dp.id_pedido = ?
        """, (pedido_id,))
        
        detalles = []
        for row in cursor.fetchall():
            detalles.append({
                'cantidad': row.cantidad,
                'precio_unitario': float(row.precio_unitario),
                'subtotal': float(row.subtotal),
                'producto_nombre': row.producto_nombre
            })
        
        pedido = {
            'id': pedido_row.id,
            'fecha_pedido': pedido_row.fecha_pedido.isoformat() if pedido_row.fecha_pedido else None,
            'total': float(pedido_row.total),
            'estatus': pedido_row.estatus,
            'telefono_contacto': pedido_row.telefono_contacto,
            'direccion': pedido_row.direccion_completa,
            'detalles': detalles
        }
        
        conn.close()
        return jsonify({'pedido': pedido})
        
    except Exception as e:
        print(f"Error en get_pedido_detalle: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/pedidos/reordenar/<int:pedido_id>', methods=['POST'])
def reordenar_pedido(pedido_id):
    """Reordenar un pedido (agregar productos al carrito)"""
    try:
        # Verificar que el usuario esté autenticado
        if 'user_id' not in session:
            return jsonify({'error': 'Usuario no autenticado'}), 401
        
        user_id = session['user_id']
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        
        # Verificar que el pedido pertenece al usuario autenticado
        cursor.execute("SELECT id_usuario FROM Pedidos WHERE id = ?", (pedido_id,))
        pedido_owner = cursor.fetchone()
        
        if not pedido_owner or pedido_owner.id_usuario != user_id:
            return jsonify({'error': 'No autorizado para reordenar este pedido'}), 403
        
        # Obtener productos del pedido original
        cursor.execute("""
            SELECT dp.id_producto, dp.cantidad, pr.nombre, pr.precio, pr.stock, pr.imagen_url
            FROM DetallesPedido dp
            JOIN Productos pr ON dp.id_producto = pr.id
            WHERE dp.id_pedido = ? AND pr.activo = 1
        """, (pedido_id,))
        
        productos = []
        for row in cursor.fetchall():
            if row.stock >= row.cantidad:  # Solo agregar si hay stock suficiente
                productos.append({
                    'id': row.id_producto,
                    'nombre': row.nombre,
                    'precio': float(row.precio),
                    'cantidad': row.cantidad,
                    'imagen_url': row.imagen_url,
                    'stock': row.stock
                })
        
        conn.close()
        
        if not productos:
            return jsonify({'error': 'No hay productos disponibles para reordenar'}), 400
        
        return jsonify({
            'success': True,
            'productos': productos,
            'message': f'Se agregaron {len(productos)} productos al carrito'
        })
        
    except Exception as e:
        print(f"Error en reordenar_pedido: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/categorias')
def get_categories():
    """Obtener todas las categorías"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        cursor.execute('SELECT id, nombre, descripcion FROM CategoriasProducto ORDER BY nombre')
        categories = cursor.fetchall()
        
        # Convertir a lista de diccionarios
        categories_list = []
        for category in categories:
            categories_list.append({
                'id': category[0],
                'name': category[1],
                'description': category[2] if category[2] else ''
            })
        
        conn.close()
        
        return jsonify({
            'success': True,
            'categories': categories_list
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error al obtener categorías: {str(e)}'
        }), 500

# =============================================
# ENDPOINTS DE CONTACTO
# =============================================

@app.route('/api/contacto', methods=['POST'])
def enviar_contacto():
    """Enviar mensaje de contacto"""
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        if not data.get('name') or not data.get('email') or not data.get('subject') or not data.get('message'):
            return jsonify({
                'success': False,
                'message': 'Todos los campos son requeridos'
            }), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'message': 'Error de conexión a la base de datos'
            }), 500
        
        cursor = conn.cursor()
        
        # 1. Verificar si el usuario ya existe por email
        cursor.execute("SELECT id FROM Usuarios WHERE email = ?", (data['email'],))
        user_row = cursor.fetchone()
        
        if user_row:
            user_id = user_row.id
        else:
            # 2. Crear nuevo usuario con solo nombre y email
            cursor.execute("""
                INSERT INTO Usuarios (nombre, email, suscrito_newsletter, activo)
                VALUES (?, ?, 0, 1)
            """, (data['name'], data['email']))
            
            # Obtener el ID del usuario creado
            cursor.execute("SELECT @@IDENTITY")
            user_id = cursor.fetchone()[0]
        
        # 3. Insertar mensaje de contacto
        cursor.execute("""
            INSERT INTO Contactos (id_usuario, asunto, mensaje, fecha_contacto, respondido)
            VALUES (?, ?, ?, GETDATE(), 0)
        """, (user_id, data['subject'], data['message']))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Mensaje enviado exitosamente. Te contactaremos pronto.'
        })
        
    except Exception as e:
        print(f"Error en enviar_contacto: {e}")
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500

# =============================================
# ENDPOINTS DE EVENTOS
# =============================================

@app.route('/api/tipos-evento')
def get_tipos_evento():
    """Obtener todos los tipos de evento únicos"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        # Usar GROUP BY para eliminar duplicados manteniendo el primer registro
        query = """
        SELECT MIN(id) as id, nombre, 
               (SELECT TOP 1 descripcion FROM TiposEvento t2 
                WHERE t2.nombre = t1.nombre ORDER BY id) as descripcion
        FROM TiposEvento t1
        GROUP BY nombre 
        ORDER BY nombre
        """
        cursor.execute(query)
        
        tipos = []
        for row in cursor.fetchall():
            tipos.append({
                'id': row.id,
                'nombre': row.nombre,
                'descripcion': row.descripcion
            })
        
        conn.close()
        return jsonify({'tipos_evento': tipos})
        
    except Exception as e:
        print(f"Error en get_tipos_evento: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/modalidades')
def get_modalidades():
    """Obtener todas las modalidades únicas"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        # Usar GROUP BY para eliminar duplicados manteniendo el primer registro
        query = """
        SELECT MIN(id) as id, nombre
        FROM Modalidades 
        GROUP BY nombre 
        ORDER BY nombre
        """
        cursor.execute(query)
        
        modalidades = []
        for row in cursor.fetchall():
            modalidades.append({
                'id': row.id,
                'nombre': row.nombre
            })
        
        conn.close()
        return jsonify({'modalidades': modalidades})
        
    except Exception as e:
        print(f"Error en get_modalidades: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/eventos/crear', methods=['POST'])
def crear_evento():
    """Crear nuevo evento"""
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['titulo', 'descripcion', 'fecha_evento', 'hora_inicio', 'id_tipo_evento', 'id_modalidad']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'El campo {field} es requerido'
                }), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'message': 'Error de conexión a la base de datos'
            }), 500
        
        cursor = conn.cursor()
        
        # Verificar si el usuario está autenticado
        user_id = None
        if 'user_id' in session:
            user_id = session['user_id']
        else:
            # Crear usuario temporal con solo nombre y email de contacto
            cursor.execute("""
                INSERT INTO Usuarios (nombre, email, suscrito_newsletter, activo)
                VALUES (?, ?, 0, 1)
            """, (data.get('nombre_organizador', 'Organizador'), data.get('contacto')))
            
            cursor.execute("SELECT @@IDENTITY")
            user_id = cursor.fetchone()[0]
        
        # Verificar si ya existe un organizador para este usuario
        cursor.execute("SELECT id FROM Organizadores WHERE id_usuario = ?", (user_id,))
        organizador_row = cursor.fetchone()
        
        if organizador_row:
            organizador_id = organizador_row.id
        else:
            # Crear nuevo organizador
            cursor.execute("""
                INSERT INTO Organizadores (id_usuario, experiencia_eventos, certificado)
                VALUES (?, 0, 0)
            """, (user_id,))
            
            cursor.execute("SELECT @@IDENTITY")
            organizador_id = cursor.fetchone()[0]
        
        # Manejar la dirección/ubicación
        direccion_id = None
        if data.get('url_evento'):
            # Para eventos virtuales, no necesitamos dirección física
            url_evento = data.get('url_evento')
        else:
            url_evento = None
        
        # Insertar el evento
        cursor.execute("""
            INSERT INTO Eventos (
                titulo, descripcion, fecha_evento, hora_inicio, hora_fin,
                id_tipo_evento, id_modalidad, url_evento, capacidad_maxima,
                costo, id_organizador, id_estatus
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        """, (
            data['titulo'],
            data['descripcion'],
            data['fecha_evento'],
            data['hora_inicio'],
            data.get('hora_fin'),
            data['id_tipo_evento'],
            data['id_modalidad'],
            url_evento,
            data.get('capacidad_maxima', 50),
            data.get('costo', 0),
            organizador_id
        ))
        
        cursor.execute("SELECT @@IDENTITY")
        evento_id = cursor.fetchone()[0]
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'evento_id': evento_id,
            'message': 'Evento creado exitosamente. Será revisado y publicado pronto.'
        })
        
    except Exception as e:
        print(f"Error en crear_evento: {e}")
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)