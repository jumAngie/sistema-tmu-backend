const express = require("express");
const sql = require("mssql");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 30000,
};

const router = express.Router();

app.get("/api/categorias", async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query("EXEC Maqu.Categorias_Listar");

    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener categorías:", err.message);
    res.status(500).json({ error: "Error al obtener categorías", details: err.message });
  }
});

app.get("/api/topsolicitudes", async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query("EXEC Maqu.TOP5_Solicitudes_Aceptadas");

    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener las top 5 solicitudes:", err.message);
    res.status(500).json({ error: "Error al obtener las solicitudes", details: err.message });
  }
});

app.get("/api/solicitudes", async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query("EXEC Maqu.Solicitudes_Todas");

    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener las solicitudes:", err.message);
    res.status(500).json({ error: "Error al obtener las solicitudes", details: err.message });
  }
});

app.get("/api/solisrechazadas", async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query("EXEC Maqu.Solicitudes_Rechazadas");

    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener las solicitudes:", err.message);
    res.status(500).json({ error: "Error al obtener las solicitudes", details: err.message });
  }
});

app.get("/api/solisaceptadas", async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query("EXEC Maqu.Solicitudes_Aceptadas");

    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener las solicitudes:", err.message);
    res.status(500).json({ error: "Error al obtener las solicitudes", details: err.message });
  }
});

app.get("/api/rastrearsolicitud/:codigo", async (req, res) => {
  const { codigo } = req.params;

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("sol_Cod", sql.NVarChar(20), codigo)
      .execute("Maqu.Rastreo_Solicitud");

    if (result.recordset.length > 0) {
      res.json(result.recordset[0]);
    } else {
      res.status(404).json({ error: "Solicitud no encontrada" });
    }
  } catch (err) {
    console.error("Error al rastrear la solicitud:", err);
    res.status(500).json({ error: "Error al rastrear la solicitud" });
  } finally {
    sql.close();
  }
});

app.post("/api/solicitudes/aceptar", async (req, res) => {
  try {
    const { sol_ID } = req.body;

    const pool = await sql.connect(dbConfig);

    const result = await pool
      .request()
      .input("sol_ID", sql.Int, sol_ID)
      .execute("Maqu.Aceptar_Solicitud");

    console.log("Resultado del procedimiento:", result.recordset);
    res.status(200).json({ message: result.recordset[0].mensaje });
  } catch (error) {
    console.error("Error al aprobar la solicitud:", error);
    res.status(500).json({ error: "Error al aprobar la solicitud" });
  } finally {
    sql.close();
  }
});

app.post("/api/buscar", async (req, res) => {
  try {
    const { searchTerm } = req.body;
    const pool = await sql.connect(dbConfig);

    const result = await pool
      .request()
      .input("sol_Buscador", sql.NVarChar(sql.MAX), searchTerm)
      .execute("Maqu.Buscador");

    res.json(result.recordset);
  } catch (error) {
    console.error("Error en la búsqueda:", error);
    res.status(500).json({ error: "Error en la búsqueda" });
  }
});

app.get('/api/Maquinas_Categorias/:cat_ID', async (req, res) => {
  const { cat_ID } = req.params;

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('cat_ID', sql.Int, cat_ID)
      .execute('Maqu.Maquinas_Categorias');
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Error al buscar máquinas:', error.message);
    res.status(500).send('Error fetching machines by category');
  }
});

app.listen(port, () => {
  console.log(`Servidor backend escuchando en http://localhost:${port}`);
});
