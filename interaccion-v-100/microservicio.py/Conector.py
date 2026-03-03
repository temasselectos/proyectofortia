from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

# 🔹 Servidores externos (alineados a tu cliente base)
RAG_URL = "http://10.9.26.114:8000/rag/query"
UPLOAD_URL = "http://10.9.26.55:5000/upload"

# ======================================================
# 🔹 ENDPOINT DE CONSULTA (Servidor RAG)
# ======================================================

@app.route("/rag/query", methods=["POST"])
def rag_query():
    try:
        data = request.get_json()

        if not data or "prompt" not in data:
            return jsonify({"error": "El campo 'prompt' es obligatorio"}), 400

        response = requests.post(
            RAG_URL,
            json={"prompt": data["prompt"]},
            timeout=10
        )

        if not response.ok:
            return jsonify({
                "error": "Error en servidor RAG",
                "detail": response.text
            }), response.status_code

        return jsonify(response.json())

    except requests.exceptions.RequestException as e:
        return jsonify({
            "error": "No se pudo conectar al servidor RAG",
            "detail": str(e)
        }), 500

    except Exception as e:
        return jsonify({
            "error": "Error interno en Flask (consulta)",
            "detail": str(e)
        }), 500


# ======================================================
# 🔹 ENDPOINT DE CARGA (Servidor Upload)
# ======================================================

@app.route("/upload", methods=["POST"])
def upload_file():
    try:
        data = request.get_json()

        if not data or "ruta" not in data:
            return jsonify({"error": "El campo 'ruta' es obligatorio"}), 400

        response = requests.post(
            UPLOAD_URL,
            json={"ruta": data["ruta"]},
            timeout=20
        )

        if not response.ok:
            return jsonify({
                "error": "Error en servidor de carga",
                "detail": response.text
            }), response.status_code

        return jsonify(response.json())

    except requests.exceptions.RequestException as e:
        return jsonify({
            "error": "No se pudo conectar al servidor de carga",
            "detail": str(e)
        }), 500

    except Exception as e:
        return jsonify({
            "error": "Error interno en Flask (upload)",
            "detail": str(e)
        }), 500


# ======================================================

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
