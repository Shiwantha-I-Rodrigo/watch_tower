import sqlite3

# Run once to create the main.db
# connection = sqlite3.connect("main.db")
# cursor = connection.cursor()
# cursor.execute("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT, UNIQUE (username))")
# cursor.execute("CREATE TABLE auth (id INTEGER PRIMARY KEY AUTOINCREMENT, auth TEXT, username TEXT, FOREIGN KEY (username) REFERENCES users(username))")
# cursor.execute("INSERT INTO users (username,password) VALUES ('tom','hashedpass');")
# cursor.execute("INSERT INTO auth (auth,username) VALUES ('admin','tom');")
# connection.commit()

# Run once to create the logs.db
# connection = sqlite3.connect("logs.db")
# cursor = connection.cursor()
# cursor.execute("CREATE TABLE storage (id INTEGER PRIMARY KEY AUTOINCREMENT, log TEXT, unix_time INTEGER, severity INTEGER)")
# cursor.execute("CREATE TABLE actions (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, action TEXT, log INTEGER, FOREIGN KEY (log) REFERENCES storage(id))")
# cursor.execute("CREATE TABLE events (id INTEGER PRIMARY KEY AUTOINCREMENT, severity INTEGER, start INTEGER, end INTEGER, FOREIGN KEY (start) REFERENCES storage(id), FOREIGN KEY (end) REFERENCES storage(id))")
# cursor.execute("INSERT INTO storage (log,unix_time,severity) VALUES ('db init',1765873499,0);")
# cursor.execute("INSERT INTO storage (log,unix_time,severity) VALUES ('db created',1765873500,0);")
# cursor.execute("INSERT INTO actions (username,action,log) VALUES ('tom','db init',0);")
# cursor.execute("INSERT INTO events (severity,start,end) VALUES (0,0,1);")
# connection.commit()

# Standard method returns a list of lists
# connection = sqlite3.connect("main.db")
# cursor = connection.cursor()
# cursor.execute("SELECT * FROM users")
# result = cursor.fetchall()

# The row_factory method to return dictionaries instead of lists
# connection = sqlite3.connect("main.db")
# connection.row_factory = sqlite3.Row
# cursor = connection.cursor()
# cursor.execute("SELECT * FROM users")
# result = [dict(row) for row in cursor.fetchall()]

def get(db, table, columns, conditions):

    try:
        connection = sqlite3.connect(db)
        connection.row_factory = sqlite3.Row
        cursor = connection.cursor()

        query = f"SELECT {columns} FROM {table} {conditions};"

        cursor.execute(query)
        logs = [dict(row) for row in cursor.fetchall()]
        connection.close()
        return logs
    except Exception as e:
        return False
