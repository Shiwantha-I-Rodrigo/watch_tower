import sqlite3

def update(db, table, data, conditions):

    try:
        with sqlite3.connect(db) as conn:
            cursor = conn.cursor()
            query = f"UPDATE {table} SET {data} WHERE {conditions};"
            cursor.execute(query)
            conn.commit()
            return False
    except Exception as e:
        return e
