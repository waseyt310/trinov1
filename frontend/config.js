/**
 * Configuration file for the Trino Database Explorer frontend
 */
const config = {
    // Development environment configuration
    development: {
        API_BASE_URL: 'http://localhost:5000/api',
    },
    
    // Production environment configuration
    production: {
        // This should be updated to your production backend URL when deployed
        API_BASE_URL: 'https://your-backend-api-url.com/api',
    },
    
    // Get the current environment configuration
    // In a real app, you might use environment variables or build flags
    // For this example, we'll use a simple hostname check
    get: function() {
        // Check if we're running on GitHub Pages
        if (window.location.hostname.includes('github.io')) {
            return this.production;
        }
        return this.development;
    }
};

