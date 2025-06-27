from flask import Blueprint, render_template, request, jsonify
from app.services.gemini import generar_comparacion, sugerir_atributos, detectar_tipo_comparacion
import json

main = Blueprint('main', __name__)

@main.route('/')
def index():
    return render_template('index.html')

@main.route('/comparar')
def comparar():
    return render_template('comparar.html')

@main.route('/api/analizar', methods=['POST'])
def analizar_opciones():
    """Analiza todas las opciones con IA"""
    try:
        data = request.json
        contexto = data.get('contexto', '')
        opciones = data.get('opciones', [])
        
        # Formatear opciones para el prompt
        opciones_texto = ""
        for opcion in opciones:
            opciones_texto += f"\n{opcion['nombre']}:\n"
            for attr, valor in opcion['atributos'].items():
                opciones_texto += f"  - {attr}: {valor}\n"
        
        # Generar comparación con IA
        resultado_json, mejor_json = generar_comparacion(contexto, opciones_texto)
        
        # Parsear resultados
        try:
            resultados = json.loads(resultado_json)
            mejor = json.loads(mejor_json)
        except:
            resultados = []
            mejor = {}
        
        return jsonify({
            'success': True,
            'resultados': resultados,
            'mejor': mejor
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@main.route('/api/analizar-caracteristica', methods=['POST'])
def analizar_caracteristica():
    """Analiza opciones enfocándose en una característica específica"""
    try:
        data = request.json
        contexto = data.get('contexto', '')
        opciones = data.get('opciones', [])
        caracteristica = data.get('caracteristica', '')
        
        # Modificar el contexto para enfocarse en la característica
        contexto_especifico = f"{contexto}. IMPORTANTE: Enfócate principalmente en comparar la característica '{caracteristica}' entre las opciones."
        
        # Formatear opciones destacando la característica
        opciones_texto = f"Comparación enfocada en: {caracteristica}\n"
        for opcion in opciones:
            opciones_texto += f"\n{opcion['nombre']}:\n"
            # Destacar la característica solicitada
            if caracteristica in opcion['atributos']:
                opciones_texto += f"  - {caracteristica}: {opcion['atributos'][caracteristica]} (*** CARACTERÍSTICA PRINCIPAL ***)\n"
            
            # Agregar otras características
            for attr, valor in opcion['atributos'].items():
                if attr != caracteristica:
                    opciones_texto += f"  - {attr}: {valor}\n"
        
        # Generar comparación con IA
        resultado_json, mejor_json = generar_comparacion(contexto_especifico, opciones_texto)
        
        # Parsear resultados
        try:
            resultados = json.loads(resultado_json)
            mejor = json.loads(mejor_json)
            
            # Agregar información específica sobre la característica
            mejor['caracteristica_analizada'] = caracteristica
            
        except:
            resultados = []
            mejor = {}
        
        return jsonify({
            'success': True,
            'resultados': resultados,
            'mejor': mejor,
            'caracteristica': caracteristica
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@main.route('/api/sugerir-atributos', methods=['POST'])
def api_sugerir_atributos():
    """Sugiere atributos basándose en el nombre de la opción"""
    try:
        data = request.json
        contexto = data.get('contexto', '')
        nombre_opcion = data.get('nombre_opcion', '')
        
        if not contexto or not nombre_opcion:
            return jsonify({
                'success': False,
                'error': 'Contexto y nombre de opción son requeridos'
            }), 400
        
        # Obtener sugerencias de la IA
        sugerencias = sugerir_atributos(contexto, nombre_opcion)
        
        return jsonify({
            'success': True,
            'atributos': sugerencias.get('atributos', {}),
            'categoria': sugerencias.get('categoria', 'general')
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@main.route('/api/detectar-tipo', methods=['POST'])
def api_detectar_tipo():
    """Detecta el tipo de comparación basándose en el contexto"""
    try:
        data = request.json
        contexto = data.get('contexto', '')
        
        if not contexto:
            return jsonify({
                'success': False,
                'error': 'Contexto es requerido'
            }), 400
        
        # Detectar tipo de comparación
        tipo_info = detectar_tipo_comparacion(contexto)
        
        return jsonify({
            'success': True,
            'tipo': tipo_info.get('tipo', 'general'),
            'atributos_sugeridos': tipo_info.get('atributos_sugeridos', []),
            'direccion_mejora': tipo_info.get('direccion_mejora', {})
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@main.route('/api/guardar-comparacion', methods=['POST'])
def guardar_comparacion():
    """Guarda una comparación para uso futuro"""
    try:
        data = request.json
        # Aquí puedes implementar la lógica para guardar en base de datos
        # Por ahora solo retornamos éxito
        return jsonify({
            'success': True,
            'mensaje': 'Comparación guardada exitosamente'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500