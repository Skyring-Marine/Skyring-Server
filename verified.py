import sys

def analizar_archivo(ruta):
    try:
        with open(ruta, 'r', encoding='utf-8') as archivo:
            contenido = archivo.read()

            # Conteo por etiquetas <FINISH>
            cantidad = contenido.count('<FINISH>')

            # Buscar el último registro antes de <FINISH>
            partes = contenido.split('<FINISH>')
            ult_registro_crudo = partes[-2].strip() if len(partes) > 1 else ""

            if not ult_registro_crudo:
                print("No se encontró el último registro correctamente.")
                return

            # Extraer el primer dato antes de la coma (número de secuencia)
            try:
                numero_ultimo = int(ult_registro_crudo.split(',')[0].strip())
            except (ValueError, IndexError):
                print("No se pudo obtener el número del último registro.")
                return

            delta = numero_ultimo - cantidad

            # Mostrar resultados
            print(f'Total de registros (por <FINISH>): {cantidad}')
            print(f'Número del último registro declarado: {numero_ultimo}')
            print(f'Diferencia (delta): {delta}')

    except Exception as e:
        print(f'Error al procesar el archivo: {e}')

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python3 verified.py ruta_del_archivo")
    else:
        analizar_archivo(sys.argv[1])
