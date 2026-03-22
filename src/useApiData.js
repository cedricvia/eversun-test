import { useState, useEffect, useCallback } from 'react';

export function useApiData(key, init = []) {
  const [data, setData] = useState(init);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les données depuis l'API
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (key === 'evs_clients') {
        // Appel API direct pour éviter les problèmes d'import
        const API_BASE = import.meta.env.VITE_API_URL || '/api';
        const response = await fetch(`${API_BASE}/clients`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const clients = await response.json();
        setData(clients);
      } else {
        // Pour les autres clés, utiliser localStorage en fallback
        const stored = localStorage.getItem(key);
        setData(stored ? JSON.parse(stored) : init);
      }
    } catch (err) {
      console.error('Erreur de chargement:', err);
      setError(err.message);
      // En cas d'erreur, essayer localStorage
      try {
        const stored = localStorage.getItem(key);
        setData(stored ? JSON.parse(stored) : init);
      } catch {
        setData(init);
      }
    } finally {
      setLoading(false);
    }
  }, [key, init]);

  // Sauvegarder les données (pour les clients via API, autres via localStorage)
  const saveData = useCallback(async (newData) => {
    try {
      if (key === 'evs_clients') {
        // Pour les clients, on ne fait pas de sauvegarde de masse
        // Chaque client est sauvegardé individuellement via les actions CRUD
        setData(newData);
      } else {
        // Pour les autres données, utiliser localStorage
        localStorage.setItem(key, JSON.stringify(newData));
        setData(newData);
      }
    } catch (err) {
      console.error('Erreur de sauvegarde:', err);
      setError(err.message);
    }
  }, [key]);

  // Actions CRUD pour les clients
  const actions = {
    addClient: async (clientData) => {
      if (key !== 'evs_clients') return;
      try {
        const API_BASE = import.meta.env.VITE_API_URL || '/api';
        const response = await fetch(`${API_BASE}/clients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clientData),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const newClient = await response.json();
        setData(prev => [...prev, newClient]);
        return newClient;
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    
    updateClient: async (id, clientData) => {
      if (key !== 'evs_clients') return;
      try {
        const API_BASE = import.meta.env.VITE_API_URL || '/api';
        const response = await fetch(`${API_BASE}/clients?id=${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clientData),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const updatedClient = await response.json();
        setData(prev => prev.map(client => 
          client._id === id ? updatedClient : client
        ));
        return updatedClient;
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    
    deleteClient: async (id) => {
      if (key !== 'evs_clients') return;
      try {
        const API_BASE = import.meta.env.VITE_API_URL || '/api';
        const response = await fetch(`${API_BASE}/clients?id=${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        setData(prev => prev.filter(client => client._id !== id));
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  return [data, saveData, loading, error, actions];
}
