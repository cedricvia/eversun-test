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
let cached = global.mongoose || { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then(mongoose => mongoose);
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}

// Handler principal
module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();
    
    const { method, query, body } = req;
    const id = query.id;

    switch (method) {
      case 'GET':
        const clients = await Client.find();
        return res.status(200).json(clients);
        
      case 'POST':
        const client = new Client(body);
        await client.save();
        return res.status(201).json(client);
        
      case 'PUT':
        const updatedClient = await Client.findByIdAndUpdate(id, body, { new: true });
        if (!updatedClient) {
          return res.status(404).json({ error: 'Client non trouvé' });
        }
        return res.status(200).json(updatedClient);
        
      case 'DELETE':
        const deletedClient = await Client.findByIdAndDelete(id);
        if (!deletedClient) {
          return res.status(404).json({ error: 'Client non trouvé' });
        }
        return res.status(200).json({ success: true });
        
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Méthode ${method} non autorisée` });
    }
  } catch (error) {
    console.error('Erreur API:', error);
    return res.status(500).json({ error: error.message });
  }
};
