# Trino Database Explorer

A web application to explore and visualize Trino database structure including catalogs, schemas, and tables.

## Features

- Browse all available catalogs in the Trino database
- List schemas within each catalog
- View tables within each schema
- Responsive web interface for all devices
- RESTful API for Trino metadata exploration

## Project Structure

```
trinov1/
├── backend/
│   ├── app.py                 # Flask backend application
│   └── trino_connection.py    # Trino database connection utility
├── frontend/
│   ├── index.html             # Main HTML page
│   ├── css/
│   │   └── styles.css         # CSS styles
│   └── js/
│       └── script.js          # Frontend JavaScript
├── .gitignore                 # Git ignore file
├── requirements.txt           # Python dependencies
└── README.md                  # This file
```

## Setup Instructions

### Prerequisites

- Python 3.8+
- pip
- A Trino database instance with proper access credentials

### Backend Setup

1. Install required Python packages:
   ```
   pip install -r requirements.txt
   ```

2. Navigate to the backend directory:
   ```
   cd backend
   ```

3. Run the Flask application:
   ```
   python app.py
   ```

   The API server will be available at http://localhost:5000

### Frontend Setup

The frontend is a static website that can be served using any static file server or opened directly in a browser.

1. Open `frontend/index.html` in your browser, or
2. Serve the frontend directory using a web server:
   ```
   # Using Python's built-in HTTP server
   python -m http.server --directory frontend 8080
   ```

   The web interface will be available at http://localhost:8080

## API Documentation

### Endpoints

| Endpoint | Method | Parameters | Description |
|----------|--------|------------|-------------|
| `/api/health` | GET | None | Check connection status |
| `/api/catalogs` | GET | None | Get all available catalogs |
| `/api/schemas` | GET | `catalog` | Get schemas for a specific catalog |
| `/api/tables` | GET | `catalog`, `schema` | Get tables for a specific schema |
| `/api/table/details` | GET | `catalog`, `schema`, `table` | Get column details for a table |

### Example Requests

#### Get all catalogs
```
GET /api/catalogs
```

#### Get schemas in a catalog
```
GET /api/schemas?catalog=example_catalog
```

#### Get tables in a schema
```
GET /api/tables?catalog=example_catalog&schema=example_schema
```

## GitHub Pages Deployment

This application is designed to be deployable to GitHub Pages. Follow these steps:

1. Push your code to GitHub repository: https://github.com/waseyt310/trinov1
2. Configure GitHub Pages in the repository settings:
   - Go to Settings > Pages
   - Source: GitHub Actions
3. The GitHub Actions workflow will automatically build and deploy the frontend

Note: Since GitHub Pages only hosts static files, the backend will need to be hosted separately.
To use the application with a live backend:

1. Deploy the backend to a hosting service that supports Python/Flask
2. Update the `production.API_BASE_URL` in `frontend/config.js` to point to your backend API

## Configuration

The application can be configured using environment variables:

- `PORT`: Port number for the Flask backend (default: 5000)
- `FLASK_DEBUG`: Enable/disable debug mode (default: True)

## Security Notes

- The application uses OAuth2 authentication for Trino connections
- CORS is enabled for secure cross-origin requests
- Connection information is not exposed to the frontend

## License

MIT
