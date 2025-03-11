from flask import Flask, request, jsonify, g, render_template
import sqlite3
from flask_cors import CORS  # Optional: enable if your frontend is separate

app = Flask(__name__)
CORS(app)  # Enable CORS if needed

DATABASE = 'investments.db'

# Helper function to get a database connection
def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row  # Return rows as dictionaries
    return db

# Close the database connection after each request
@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

# Initialize the database and create the investments table if it doesn't exist
def init_db():
    with app.app_context():
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS investments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                stock_symbol TEXT NOT NULL,
                shares REAL NOT NULL,
                avg_price REAL NOT NULL,
                daily_change REAL
            )
        ''')
        db.commit()

# Route to serve the main page (index.html from the /templates folder)
@app.route('/')
def index():
    return render_template('index.html')

# API endpoint to retrieve all investments
@app.route('/investments', methods=['GET'])
def get_investments():
    db = get_db()
    cursor = db.cursor()
    cursor.execute('SELECT * FROM investments')
    investments = [dict(row) for row in cursor.fetchall()]
    return jsonify(investments)

# API endpoint to add a new investment
@app.route('/investment', methods=['POST'])
def add_investment():
    data = request.get_json()
    stock_symbol = data.get('stock_symbol')
    shares = data.get('shares')
    avg_price = data.get('avg_price')
    daily_change = data.get('daily_change', None)  # Optional field
    db = get_db()
    cursor = db.cursor()
    cursor.execute('''
        INSERT INTO investments (stock_symbol, shares, avg_price, daily_change)
        VALUES (?, ?, ?, ?)
    ''', (stock_symbol, shares, avg_price, daily_change))
    db.commit()
    return jsonify({'id': cursor.lastrowid}), 201

# API endpoint to update an existing investment
@app.route('/investment/<int:id>', methods=['PUT'])
def update_investment(id):
    data = request.get_json()
    stock_symbol = data.get('stock_symbol')
    shares = data.get('shares')
    avg_price = data.get('avg_price')
    daily_change = data.get('daily_change', None)
    db = get_db()
    cursor = db.cursor()
    cursor.execute('''
        UPDATE investments
        SET stock_symbol = ?, shares = ?, avg_price = ?, daily_change = ?
        WHERE id = ?
    ''', (stock_symbol, shares, avg_price, daily_change, id))
    db.commit()
    return jsonify({'updated': True})

# API endpoint to delete an investment
@app.route('/investment/<int:id>', methods=['DELETE'])
def delete_investment(id):
    db = get_db()
    cursor = db.cursor()
    cursor.execute('DELETE FROM investments WHERE id = ?', (id,))
    db.commit()
    return jsonify({'deleted': True})

if __name__ == '__main__':
    init_db()  # Ensure the database is initialized
    app.run(debug=True)
