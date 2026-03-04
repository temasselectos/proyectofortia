from flask import Flask, request, jsonify
from pypdf import PdfReader
import requests
import os

app = Flask(__name__)

@app.route('/upload', methods=['POST'])
def procesar():

    data = request.get_json()
    ruta = data.get("ruta")
    archivos = data.get("archivos")

    if not ruta:
        return jsonify({"error": "No se recibió ruta"}), 400

    if not os.path.exists(ruta):
        return jsonify({"error": "La ruta no existe"}), 400
    
    resultados = []

    try:
        # -------- UNIR RUTA Y ARCHIVO --------
        for nombre_archivo in archivos:

            ruta_completa = os.path.join(ruta, nombre_archivo)

            if not os.path.exists(ruta_completa):
                resultados.append({
                    "archivo": nombre_archivo,
                    "error": "No existe"
                })
                continue

        # -------- EXTRAER TEXTO --------
            reader = PdfReader(ruta_completa)

            texto = ""
            for pagina in reader.pages:
                contenido = pagina.extract_text()
                if contenido:
                    texto += contenido + "\n"

        # -------- CREAR PAYLOAD PARA KB --------
            payload = {
                "archivo": nombre_archivo,
                "contenido": texto
            }

        # -------- ENVIAR A KB --------
            respuesta = requests.post(
                'http://10.9.26.92:3000/extraccion',
                json=payload
            )

            resultados.append({
                "archivo": nombre_archivo,
                "status_envio": respuesta.status_code
            })

        # ------- RESPUESTA FINAL A INTERFAZ --------
        return jsonify({
            "mensaje": "Archivos procesados y enviados",
            "resultados": resultados
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)