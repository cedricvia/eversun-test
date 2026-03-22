require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connecté"))
  .catch((err) => console.error(err));

app.use("/api/clients", require("./routes/clients"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Serveur sur le port " + PORT));
