from google.generativeai import configure, GenerativeModel
import json
import os

# Usar variable de entorno para la API key
API_KEY = os.getenv('GEMINI_API_KEY', 'AIzaSyDzv-htlOsskw9Fe-foaaIKTYMhx-VxyZA')
configure(api_key=API_KEY)

model = GenerativeModel('gemini-1.5-flash')

def sugerir_atributos(contexto, nombre_opcion):
    """
    Sugiere atributos relevantes basándose en el contexto y el nombre de la opción
    """
    prompt = f"""
Basándote en el siguiente contexto de comparación:
"{contexto}"

Y el nombre de esta opción específica:
"{nombre_opcion}"

Sugiere los atributos más relevantes para comparar este tipo de elemento.
IMPORTANTE: 
- Los valores deben ser realistas y basados en información real cuando sea posible
- Para productos conocidos (como iPhone 15, Samsung S24, etc.) usa especificaciones reales
- Los atributos deben ser numéricos cuando sea posible para facilitar la comparación
- Incluye entre 5-10 atributos relevantes

Devuelve ÚNICAMENTE un JSON con este formato exacto:
{{
  "atributos": {{
    "nombre_atributo1": valor_numerico,
    "nombre_atributo2": valor_numerico,
    ...
  }},
  "categoria": "tipo de producto/servicio/persona"
}}

Ejemplos de categorías: "smartphone", "laptop", "candidato", "auto", "servicio_cloud", etc.
"""
    
    try:
        response = model.generate_content(prompt)
        texto = response.text.strip()
        
        # Limpiar el texto para obtener solo el JSON
        if "```json" in texto:
            texto = texto.split("```json")[1].split("```")[0].strip()
        elif "```" in texto:
            texto = texto.split("```")[1].split("```")[0].strip()
        
        return json.loads(texto)
    except Exception as e:
        print(f"Error al sugerir atributos: {e}")
        return {
            "atributos": {},
            "categoria": "desconocido"
        }

def detectar_tipo_comparacion(contexto):
    """
    Detecta qué tipo de comparación se está realizando basándose en el contexto
    """
    prompt = f"""
Analiza el siguiente contexto de comparación:
"{contexto}"

Determina:
1. Qué tipo de elementos se están comparando
2. Los atributos más importantes para este tipo de comparación
3. Si los valores más altos o más bajos son mejores para cada atributo

Devuelve ÚNICAMENTE un JSON con este formato:
{{
  "tipo": "categoría principal",
  "atributos_sugeridos": ["atributo1", "atributo2", ...],
  "direccion_mejora": {{
    "atributo1": "mayor" o "menor",
    "atributo2": "mayor" o "menor",
    ...
  }}
}}
"""
    
    try:
        response = model.generate_content(prompt)
        texto = response.text.strip()
        
        if "```json" in texto:
            texto = texto.split("```json")[1].split("```")[0].strip()
        elif "```" in texto:
            texto = texto.split("```")[1].split("```")[0].strip()
            
        return json.loads(texto)
    except Exception as e:
        print(f"Error al detectar tipo: {e}")
        return {
            "tipo": "general",
            "atributos_sugeridos": [],
            "direccion_mejora": {}
        }

def generar_comparacion(contexto, opciones):
    """
    Función original mejorada que considera la dirección de mejora
    """
    # Primero detectar el tipo de comparación
    tipo_comparacion = detectar_tipo_comparacion(contexto)
    
    prompt = f"""
Eres un asistente de comparación experto. Con base en el siguiente contexto:

"{contexto}"

Tipo de comparación detectado: {tipo_comparacion['tipo']}

Y estas opciones con atributos:

{opciones}

IMPORTANTE - Dirección de mejora para cada atributo:
{json.dumps(tipo_comparacion['direccion_mejora'], indent=2)}

Analiza cada opción considerando que algunos atributos son mejores cuando son MENORES (como precio, peso, consumo) 
y otros cuando son MAYORES (como velocidad, capacidad, calidad).

Asígnale una puntuación de 1 a 10 (siendo 10 la mejor) y selecciona cuál es la más adecuada explicando por qué.

Devuelve dos bloques:

1. Un JSON tipo lista como este:
[
  {{
    "nombre": "...",
    "puntaje": ...,
    "razon": "..."
  }},
  ...
]

2. Un JSON con el mejor:
{{
  "mejor": "...",
  "razon_mejor": "..."
}}
"""

    response = model.generate_content(prompt)
    texto = response.text

    try:
        partes = texto.strip().split("```json")
        resultado = partes[1].split("```")[0].strip()
        resultado_extra = partes[2].split("```")[0].strip()
    except:
        resultado = texto
        resultado_extra = "{}"

    return resultado, resultado_extra 