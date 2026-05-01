from database.db import engine

conn = engine.connect()
print("Connected to Neon DB 🚀")
conn.close()