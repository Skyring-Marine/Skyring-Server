import argparse
import sys

def contar_registros(input_file):
    total_registros = 0
    try:
        with open(input_file, 'r') as f:
            for idx, line in enumerate(f, 1):
                if line.strip():  # Línea no vacía
                    total_registros += 1
                else:
                    print(f"⚠️ Línea {idx} vacía o inválida omitida", file=sys.stderr)

        print(f"CANTIDAD_REGISTROS={total_registros}")

    except FileNotFoundError:
        print(f"❌ Error: Archivo '{input_file}' no encontrado.", file=sys.stderr)
    except Exception as e:
        print(f"❌ Error inesperado: {e}", file=sys.stderr)


def main():
    parser = argparse.ArgumentParser(description="Contador simple de registros en archivo TXT formato 8")
    parser.add_argument("input_file", help="Ruta del archivo .txt a procesar")

    args = parser.parse_args()
    contar_registros(args.input_file)


if __name__ == "__main__":
    main()