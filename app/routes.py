from flask import Blueprint, render_template, request, redirect, url_for, jsonify
from flask import request, jsonify, json
from app.services.gemini import generar_comparacion

main = Blueprint('main', __name__)

@main.route("/")
def index():
    return render_template("index.html")

@main.route("/comparar")
def comparar():
    return render_template("comparar.html")


@main.route("/api/comparar", methods=["POST"])
def api_comparar():
    try:
        data = request.get_json()
        contexto = data.get("contexto")
        opciones = data.get("opciones")  # ← ya es un objeto válido

        resultado, resultado_extra = generar_comparacion(contexto, opciones)
        return jsonify({
            "resultado": resultado,
            "resultado_extra": resultado_extra
        })
            

    except Exception as e:
        return jsonify({ "error": str(e) }), 500
