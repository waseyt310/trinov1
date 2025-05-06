// Configuration
const API_BASE_URL = 'http://localhost:5000/api'; // Change this in production

// State management
let currentState = {
    catalog: null,
    schema: null,
    table: null
};

// DOM Elements
const elements = {
    connectionStatus: {
        container: document.getElementById('connection-status'),
        dot: document.querySelector('#connection-status .status-dot'),
        text: document.querySelector('#connection-status .status-text')
    },
    catalogs: {
        list: document.getElementById('catalogs-list')
    },
    schemas: {
        container: document.getElementById('schemas-container'),
        list: document.getElementById('schemas-list')
    },
    tables: {
        container: document.getElementById('tables-container'),
        list: document.getElementById('tables-list')
    },
    content: {
        title: document.getElementById('content-title'),
        welcome: document.getElementById('welcome-message'),
        breadcrumbs: document.getElementById('breadcrumbs')
    },
    error: {
        container: document.getElementById('error-container'),
        message: document.getElementById('error-message')
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    checkConnectionStatus();
    loadCatalogs();
});

// API Functions
async function fetchAPI(endpoint, params = {}) {
    try {
        // Build URL with query parameters if needed
        let url = `${API_BASE_URL}/${endpoint}`;
        if (Object.keys(params).length > 0) {
            const queryParams = new URLSearchParams(params);
            url += `?${queryParams.toString()}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'An error occurred while fetching data');
        }
        
        return await response.json();
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        showError(error.message);
        return null;
    }
}

async function checkConnectionStatus() {
    try {
        const result = await fetchAPI('health');
        if (result && result.status === 'healthy') {
            updateConnectionStatus(true);
        } else {
            updateConnectionStatus(false, result?.message || 'Connection failed');
        }
    } catch (error) {
        updateConnectionStatus(false, error.message);
    }
}

async function loadCatalogs() {
    try {
        const data = await fetchAPI('catalogs');
        if (data && data.catalogs) {
            renderCatalogs(data.catalogs);
        }
    } catch (error) {
        showError('Failed to load catalogs: ' + error.message);
    }
}

async function loadSchemas(catalog) {
    try {
        showLoading(elements.schemas.list);
        const data = await fetchAPI('schemas', { catalog });
        if (data && data.schemas) {
            renderSchemas(data.schemas, catalog);
        }
    } catch (error) {
        showError('Failed to load schemas: ' + error.message);
    }
}

async function loadTables(catalog, schema) {
    try {
        showLoading(elements.tables.list);
        const data = await fetchAPI('tables', { catalog, schema });
        if (data && data.tables) {
            renderTables(data.tables, catalog, schema);
        }
    } catch (error) {
        showError('Failed to load tables: ' + error.message);
    }
}

// UI Update Functions
function updateConnectionStatus(isConnected, message = null) {
    if (isConnected) {
        elements.connectionStatus.dot.classList.remove('disconnected');
        elements.connectionStatus.dot.classList.add('connected');
        elements.connectionStatus.text.textContent = 'Connected to Trino';
    } else {
        elements.connectionStatus.dot.classList.remove('connected');
        elements.connectionStatus.dot.classList.add('disconnected');
        elements.connectionStatus.text.textContent = message || 'Disconnected from Trino';
    }
}

function renderCatalogs(catalogs) {
    if (!catalogs || catalogs.length === 0) {
        elements.catalogs.list.innerHTML = '<div class="no-data">No catalogs found</div>';
        return;
    }

    elements.catalogs.list.innerHTML = '';
    catalogs.forEach(catalog => {
        const catalogItem = document.createElement('div');
        catalogItem.className = 'tree-item catalog-item';
        catalogItem.innerHTML = `<i class="fas fa-database"></i> ${catalog}`;
        catalogItem.addEventListener('click', () => selectCatalog(catalog));
        elements.catalogs.list.appendChild(catalogItem);
    });
}

function renderSchemas(schemas, catalog) {
    if (!schemas || schemas.length === 0) {
        elements.schemas.list.innerHTML = '<div class="no-data">No schemas found in this catalog</div>';
        return;
    }

    elements.schemas.list.innerHTML = '';
    schemas.forEach(schema => {
        const schemaItem = document.createElement('div');
        schemaItem.className = 'data-item schema-item';
        schemaItem.innerHTML = `<i class="fas fa-folder"></i> ${schema}`;
        schemaItem.addEventListener('click', () => selectSchema(catalog, schema));
        elements.schemas.list.appendChild(schemaItem);
    });

    elements.schemas.container.style.display = 'block';
    elements.tables.container.style.display = 'none';
}

function renderTables(tables, catalog, schema) {
    if (!tables || tables.length === 0) {
        elements.tables.list.innerHTML = '<div class="no-data">No tables found in this schema</div>';
        return;
    }

    elements.tables.list.innerHTML = '';
    tables.forEach(table => {
        const tableItem = document.createElement('div');
        tableItem.className = 'data-item table-item';
        tableItem.innerHTML = `<i class="fas fa-table"></i> ${table}`;
        tableItem.addEventListener('click', () => selectTable(catalog, schema, table));
        elements.tables.list.appendChild(tableItem);
    });

    elements.tables.container.style.display = 'block';
}

function updateBreadcrumbs() {
    elements.content.breadcrumbs.innerHTML = '<span>Home</span>';
    
    if (currentState.catalog) {
        elements.content.breadcrumbs.innerHTML += `<span>${currentState.catalog}</span>`;
    }
    
    if (currentState.schema) {
        elements.content.breadcrumbs.innerHTML += `<span>${currentState.schema}</span>`;
    }
    
    if (currentState.table) {
        elements.content.breadcrumbs.innerHTML += `<span>${currentState.table}</span>`;
    }
}

// Navigation Functions
function selectCatalog(catalog) {
    // Update state
    currentState = {
        catalog: catalog,
        schema: null,
        table: null
    };
    
    // Update UI
    elements.content.welcome.style.display = 'none';
    elements.error.container.style.display = 'none';
    elements.content.title.textContent = `Catalog: ${catalog}`;
    updateBreadcrumbs();
    
    // Highlight the selected catalog
    const catalogItems = document.querySelectorAll('.catalog-item');
    catalogItems.forEach(item => {
        if (item.textContent.trim().includes(catalog)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Load schemas for the selected catalog
    loadSchemas(catalog);
}

function selectSchema(catalog, schema) {
    // Update state
    currentState = {
        catalog: catalog,
        schema: schema,
        table: null
    };
    
    // Update UI
    elements.content.title.textContent = `Schema: ${schema}`;
    updateBreadcrumbs();
    
    // Load tables for the selected schema
    loadTables(catalog, schema);
}

function selectTable(catalog, schema, table) {
    // Update state
    currentState = {
        catalog: catalog,
        schema: schema,
        table: table
    };
    
    // Update UI
    elements.content.title.textContent = `Table: ${table}`;
    updateBreadcrumbs();
    
    // TODO: Add functionality to show table details/preview if needed
}

// Utility Functions
function showError(message) {
    elements.error.message.textContent = message;
    elements.error.container.style.display = 'block';
    
    // Hide loading indicators
    hideLoading(elements.catalogs.list);
    hideLoading(elements.schemas.list);
    hideLoading(elements.tables.list);
}

function showLoading(element) {
    element.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
}

function hideLoading(element) {
    const spinner = element.querySelector('.loading-spinner');
    if (spinner) {
        spinner.remove();
    }
}

// For responsive design
function handleResponsiveLayout() {
    const windowWidth = window.innerWidth;
    if (windowWidth < 768) {
        // Adjust layout for mobile
        document.querySelector('.explorer').classList.add('mobile-view');
    } else {
        document.querySelector('.explorer').classList.remove('mobile-view');
    }
}

// Listen for window resize
window.addEventListener('resize', handleResponsiveLayout);
// Initialize responsive layout
handleResponsiveLayout();

