const mongoose = require('mongoose');

// Modèle Client
const ClientSchema = new mongoose.Schema({
  nom: String,
  prenom: String,
  email: String,
  tel: String,
  adresse: String,
  stage: String,
  dossier: String,
});

const Client = mongoose.models.Client || mongoose.model('Client', ClientSchema);

// Connexion MongoDB
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('ERREUR: MONGO_URI n\'est pas défini dans les variables d\'environnement');
  console.error('Variables disponibles:', Object.keys(process.env));
}

let cached = global.mongoose || { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  
  if (!cached.promise) {
    if (!MONGO_URI) {
      const errorMsg = 'MONGO_URI n\'est pas configuré';
      console.error('❌', errorMsg);
      console.error('Variables d\'environnement disponibles:', Object.keys(process.env));
      throw new Error(errorMsg);
    }
    
    console.log('🔗 Tentative de connexion MongoDB...');
    console.log('📍 MONGO_URI:', MONGO_URI ? MONGO_URI.substring(0, 20) + '...' : 'NON DÉFINI');
    
    cached.promise = mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout après 5 secondes
      bufferCommands: false,
      bufferMaxEntries: 0
    }).then(mongoose => {
      console.log('✅ Connecté à MongoDB avec succès');
      console.log('📊 Database:', mongoose.connection.name);
      return mongoose;
    }).catch(error => {
      console.error('💥 Erreur détaillée de connexion MongoDB:');
      console.error('   Code erreur:', error.code || 'UNKNOWN');
      console.error('   Message:', error.message);
      console.error('   Stack complète:', error.stack);
      
      // Messages d'erreur spécifiques pour debugging
      if (error.code === 'ENOTFOUND') {
        console.error('🔍 Solution: Vérifiez l\'hôte et la base de données MongoDB');
      } else if (error.code === 'ECONNREFUSED') {
        console.error('🔍 Solution: Vérifiez le firewall MongoDB et les identifiants');
      } else if (error.code === 'ECONNRESET') {
        console.error('🔍 Solution: Réseau instable, réessayez');
      }
      
      throw new Error(`Erreur de connexion MongoDB: ${error.message}`);
    });
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}

// Handler principal
module.exports = async (req, res) => {
  console.log('📡 API Clients appelée - Method:', req.method, 'Query:', req.query);
  
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS request handled');
    return res.status(200).end();
  }

  // Vérifier si MongoDB est configuré
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI non configuré - utilisation du mode démo');
    
    // Mode démo avec données factices
    const demoClients = [
      {
        _id: 'demo1',
        nom: 'Demo',
        prenom: 'Client',
        email: 'demo@eversun.fr',
        tel: '0123456789',
        adresse: '123 Rue de la Démo',
        stage: 'Attente document',
        dossier: 'DOS-EV-0001'
      }
    ];
    
    const { method, query, body } = req;
    const id = query.id;
    
    switch (method) {
      case 'GET':
        console.log('📋 GET clients - mode démo');
        return res.status(200).json(demoClients);
        
      case 'POST':
        console.log('➕ POST client - mode démo, non autorisé');
        return res.status(503).json({ 
          error: 'Mode démo: création non autorisée sans MongoDB' 
        });
        
      case 'PUT':
        console.log('✏️ PUT client - mode démo, non autorisé');
        return res.status(503).json({ 
          error: 'Mode démo: modification non autorisée sans MongoDB' 
        });
        
      case 'DELETE':
        console.log('🗑️ DELETE client - mode démo, non autorisé');
        return res.status(503).json({ 
          error: 'Mode démo: suppression non autorisée sans MongoDB' 
        });
        
      default:
        console.log('❌ Method not allowed:', method);
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Méthode ${method} non autorisée` });
    }
  }

  try {
    await connectDB();
    console.log('✅ Connexion DB réussie');
    
    const { method, query, body } = req;
    const id = query.id;
    
    console.log('🔍 Processing request - Method:', method, 'ID:', id, 'Body keys:', body ? Object.keys(body) : 'none');

    switch (method) {
      case 'GET':
        console.log('📋 GET clients - fetching all...');
        const clients = await Client.find();
        console.log('✅ GET clients success - count:', clients.length);
        return res.status(200).json(clients);
        
      case 'POST':
        console.log('➕ POST client - creating:', body);
        const client = new Client(body);
        await client.save();
        console.log('✅ POST client success - created:', client._id);
        return res.status(201).json(client);
        
      case 'PUT':
        if (!id) {
          console.log('❌ PUT error - missing ID');
          return res.status(400).json({ error: 'ID requis pour la modification' });
        }
        console.log('✏️ PUT client - ID:', id, 'data:', body);
        const updatedClient = await Client.findByIdAndUpdate(id, body, { new: true });
        if (!updatedClient) {
          console.log('❌ PUT error - client not found:', id);
          return res.status(404).json({ error: 'Client non trouvé' });
        }
        console.log('✅ PUT client success - updated:', updatedClient._id);
        return res.status(200).json(updatedClient);
        
      case 'DELETE':
        if (!id) {
          console.log('❌ DELETE error - missing ID');
          return res.status(400).json({ error: 'ID requis pour la suppression' });
        }
        console.log('🗑️ DELETE client - ID:', id);
        const deletedClient = await Client.findByIdAndDelete(id);
        if (!deletedClient) {
          console.log('❌ DELETE error - client not found:', id);
          return res.status(404).json({ error: 'Client non trouvé' });
        }
        console.log('✅ DELETE client success - deleted:', deletedClient._id);
        return res.status(200).json({ success: true });
        
      default:
        console.log('❌ Method not allowed:', method);
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Méthode ${method} non autorisée` });
    }
  } catch (error) {
    console.error('💥 ERREUR API:', error);
    console.error('Stack:', error.stack);
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
};
