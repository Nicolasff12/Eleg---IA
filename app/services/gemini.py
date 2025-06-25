from google.generativeai import configure, GenerativeModel

API_KEY = "AIzaSyDzv-htlOsskw9Fe-foaaIKTYMhx-VxyZA"
configure(api_key=API_KEY)

model = GenerativeModel('gemini-1.5-flash')  # Usa este modelo que sí aparece en tu uso

def generar_comparacion(contexto, opciones):
    prompt = f"""
Eres un asistente de comparación. Con base en el siguiente contexto:

"{contexto}"

Y estas opciones con atributos:

{opciones}

Analiza cada opción, asígnale una puntuación de 1 a 10 (siendo 10 la mejor) y selecciona cuál es la más adecuada explicando por qué.
Devuelve los resultados en formato JSON:
[
  {{
    "nombre": "...",
    "puntaje": ...,
    "razon": "..."
  }},
  ...
]
Incluye una clave `"mejor"` indicando la opción más recomendable.
"""
    response = model.generate_content(prompt)
    return response.text

import json

def generar_comparacion(contexto, opciones):
    prompt = f"""
Eres un asistente de comparación. Con base en el siguiente contexto:

"{contexto}"

Y estas opciones con atributos:

{opciones}

Analiza cada opción, asígnale una puntuación de 1 a 10 (siendo 10 la mejor) y selecciona cuál es la más adecuada explicando por qué.
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
