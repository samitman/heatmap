# Portfolio Heatmap

Portfolio Heatmap is an interactive web-based dashboard that visualizes your investment portfolio using a dynamic treemap layout. Each investment is represented by a tile whose area is proportional to its value, and the tiles display the daily percentage change along with detailed information on hover.

## Features

- **Dynamic Treemap Layout:**  
  Tiles are arranged using a slice-and-dice treemap algorithm, where each tile’s area is proportional to the investment value.

- **Interactive Investment Tiles:**  
  - **Default View:** Shows the stock ticker and daily percentage change.
  - **Hover View:** Reveals detailed information such as the number of shares, average price, and total investment value, along with edit/delete options.

- **Investment Management:**  
  Easily add, edit, or delete investments using a user-friendly interface.

- **Persistent Data:**  
  A lightweight Python backend with SQLite stores your investment data persistently. Data will remain even after restarting the app.

- **Responsive & Modern Design:**  
  Features a sleek dark theme that adapts to different screen sizes.

## Project Structure
- **/static:** Contains all your CSS, JavaScript, and image files.
- **/templates:** Contains your HTML files.
- **app.py:** Runs the Flask server, serves the frontend, and provides REST API endpoints for CRUD operations.
- **/venv:** Holds your Python virtual environment (ensure this is added to your `.gitignore`).

## Installation & Setup

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/yourusername/portfolio-heatmap.git
   cd portfolio-heatmap

2. **Set Up the Virtual Environment:**

  On macOS/Linux:
  bash
  Copy
  python3 -m venv venv
  source venv/bin/activate

  On Windows:
  bash
  Copy
  python -m venv venv
  venv\Scripts\activate

3. **Install Dependencies:**

  Install Flask (and Flask-CORS if needed):

  bash
  Copy
  pip install Flask flask-cors

  Database Initialization:

  The SQLite database (investments.db) is automatically initialized when you run the app if it doesn't already exist.

4. **Running the Application:**
  To start the Flask development server, run:

  bash
  Copy
  python app.py
  This will launch the server at http://127.0.0.1:5000/.