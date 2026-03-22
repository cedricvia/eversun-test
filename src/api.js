const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error || `HTTP ${response.status}`, response.status);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Erreur de connexion au serveur', 0);
  }
}

export const api = {
  // Clients
  getClients: () => apiRequest('/clients'),
  createClient: (client) => apiRequest('/clients', {
    method: 'POST',
    body: JSON.stringify(client),
  }),
  updateClient: (id, client) => apiRequest(`/clients?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(client),
  }),
  deleteClient: (id) => apiRequest(`/clients?id=${id}`, {
    method: 'DELETE',
  }),
};
