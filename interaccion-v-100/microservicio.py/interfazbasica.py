import requests

URL_QUERY = 'http://10.9.26.114:8000/rag/query'
URL_UPLOAD = 'http://10.9.26.55:5000/upload'
print("Selecciona una opción:")
print("1 - Enviar prompt")
print("2 - Cargar documento")

opcion = input("Opción: ")

# ==========================
# OPCIÓN 1: ENVIAR PROMPT
# ==========================
if opcion == "1":
    prompt_usuario = input("Escribe tu prompt: ")

    payload = {
        'prompt': prompt_usuario
    }

    response = requests.post(URL_QUERY, json=payload)

    if response.status_code == 200:
        print("\nRespuesta del servidor:")
        print(response.text)
    else:
        print(f'Error: {response.status_code} - {response.text}')

# ==========================
# OPCIÓN 2: SUBIR ARCHIVO
# ==========================
elif opcion == "2":
    ruta = r"C:/Users/chuuy/Desktop/Prototipo/Ejemplos CV/EjemploCV1.pdf"

    payload = {
        'ruta': ruta 
    }

    response = requests.post(URL_UPLOAD, json=payload)

    if response.status_code == 200:
        print("\nRespuesta del servidor:")
        print(response.text)
    else:
        print(f'Error: {response.status_code} - {response.text}')

else:
    print("Opción no válida.")



