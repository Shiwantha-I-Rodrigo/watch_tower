import sqlite3

def put(db, table ,columns, values):

    try:
        with sqlite3.connect(db) as conn:
            cursor = conn.cursor()
            query = f"INSERT INTO {table} ({columns}) VALUES ({values});"
            cursor.execute(query)
            conn.commit()
            return False
    except Exception as e:
        return e
