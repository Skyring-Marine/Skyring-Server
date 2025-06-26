import sys

def contar_registros(ruta_archivo):
    try:
        with open(ruta_archivo, 'r', encoding='utf-8') as archivo:
            lineas = archivo.readlines()
            cantidad_registros = len(lineas)
            print(f'Cantidad de registros: {cantidad_registros}')
    except FileNotFoundError:
        print(f'El archivo {ruta_archivo} no se encontró.')
    except Exception as e:
        print(f'Ocurrió un error: {e}')

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python contar_registros.py ruta_del_archivo")
    else:
        ruta = sys.argv[1]
        contar_registros(ruta)
