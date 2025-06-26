import sys

def contar_registros(ruta):
    try:
        with open(ruta, 'r', encoding='utf-8') as archivo:
            contenido = archivo.read()
            cantidad = contenido.count('<FINISH>')
            print(f'Total de registros: {cantidad}')
    except Exception as e:
        print(f'Error al procesar el archivo: {e}')

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python3 verified.py ruta_del_archivo")
    else:
        contar_registros(sys.argv[1])
