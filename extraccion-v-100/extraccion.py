from flask import Flask, request, jsonify
from pypdf import PdfReader
import requests
import os

app = Flask(__name__)

@app.route('/upload', methods=['POST'])
def procesar():

    data = request.get_json()
    ruta = data.get("ruta")

    if not ruta:
        return jsonify({"error": "No se recibió ruta"}), 400

    if not os.path.exists(ruta):
        return jsonify({"error": "La ruta no existe"}), 400

    try:
        # -------- EXTRAER TEXTO --------
        reader = PdfReader(ruta)

        texto = ""
        for pagina in reader.pages:
            contenido = pagina.extract_text()
            if contenido:
                texto += contenido + "\n"

        # -------- CREAR PAYLOAD PARA KB --------
        payload = {
            "archivo": os.path.basename(ruta),
            "contenido": texto
        }

        # -------- ENVIAR A KB --------
        respuesta = requests.post(
            'http://10.9.26.92:3000/extraccion',
            json=payload
        )

        return jsonify({
            "mensaje": "Archivo procesado y enviado",
            "respuesta_servidor_final": respuesta.json()
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)