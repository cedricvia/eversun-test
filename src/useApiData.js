import { useState, useEffect, useCallback } from 'react';
import api from './api';

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
        const clients = await api.getClients();
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
        const newClient = await api.createClient(clientData);
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
        const updatedClient = await api.updateClient(id, clientData);
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
        await api.deleteClient(id);
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
