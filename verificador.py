import sys
import os

def insertar_separadores(ruta_archivo):
    try:
        with open(ruta_archivo, 'r', encoding='utf-8') as archivo:
            lineas = archivo.readlines()

        cantidad_registros = len(lineas)
        print(f'Cantidad de registros detectados: {cantidad_registros}')

        nombre_salida = generar_nombre_salida(ruta_archivo)

        with open(nombre_salida, 'w', encoding='utf-8') as archivo_salida:
            for linea in lineas:
                linea = linea.rstrip('\n')  # Limpiar salto de línea existente
                archivo_salida.write(linea + '\n')
                archivo_salida.write('<FINISH>\n')  # Separador entre registros

        print(f'✅ Archivo corregido generado: {nombre_salida}')

    except FileNotFoundError:
        print(f'❌ El archivo {ruta_archivo} no se encontró.')
    except Exception as e:
        print(f'⚠️ Ocurrió un error: {e}')

def generar_nombre_salida(ruta_original):
    carpeta, nombre = os.path.split(ruta_original)
    base, _ = os.path.splitext(nombre)
    nuevo_nombre = f"{base}_verified.txt"
    return os.path.join(carpeta, nuevo_nombre)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python insertar_separadores.py ruta_del_archivo")
    else:
        ruta = sys.argv[1]
        insertar_separadores(ruta)
