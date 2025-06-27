from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'tu-clave-secreta-aqui'
    
    # Habilitar CORS para permitir llamadas AJAX
    CORS(app)
    
    # Registrar blueprints
    from app.routes import main
    app.register_blueprint(main)
    
    return app