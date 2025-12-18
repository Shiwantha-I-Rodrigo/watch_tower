import sqlite3

def delete(db, table ,conditions):

    try:
        with sqlite3.connect(db) as conn:
            cursor = conn.cursor()
            query = f"DELETE FROM {table} WHERE {conditions};"
            cursor.execute(query)
            conn.commit()
            return False
    except Exception as e:
        return e
