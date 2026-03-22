const mongoose = require("mongoose");

const ClientSchema = new mongoose.Schema({
  nom: String,
  prenom: String,
  email: String,
  tel: String,
  adresse: String,
  stage: String,
  dossier: String,
});

module.exports = mongoose.model("Client", ClientSchema);
