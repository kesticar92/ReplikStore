#!/usr/bin/env python3
import os
import sqlite3

ROOT = os.path.dirname(os.path.abspath(__file__))
DB_DIR = os.path.join(ROOT, "backend", "basedeDatos")
OUTPUT = os.path.join(ROOT, "resultados.txt")

with open(OUTPUT, "w", encoding="utf-8") as out:
    out.write(f"Consultando bases de datos en {DB_DIR}...\n")
    for dbfile in os.listdir(DB_DIR):
        if dbfile.endswith(".db"):
            dbpath = os.path.join(DB_DIR, dbfile)
            out.write("\n==============================\n")
            out.write(f"Base de datos: {dbfile}\n")
            out.write("==============================\n")
            try:
                conn = sqlite3.connect(dbpath)
                cursor = conn.cursor()
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                tables = [row[0] for row in cursor.fetchall()]
                for table in tables:
                    out.write(f"\n--- Tabla: {table} ---\n")
                    try:
                        cursor.execute(f"SELECT * FROM {table} LIMIT 50;")
                        columns = [desc[0] for desc in cursor.description]
                        out.write("\t".join(columns) + "\n")
                        for row in cursor.fetchall():
                            out.write("\t".join(str(x) for x in row) + "\n")
                    except Exception as e:
                        out.write(f"Error consultando tabla {table}: {e}\n")
                conn.close()
            except Exception as e:
                out.write(f"Error abriendo base de datos {dbfile}: {e}\n")
    out.write("\nConsulta completada. Resultados en resultados.txt\n")

print("Consulta completada. Puedes abrir resultados.txt para ver los datos.")