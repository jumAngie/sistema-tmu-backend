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
    res
      .status(500)
      .json({ error: "Error al obtener categorías", details: err.message });
  }
});

app.get("/api/topsolicitudes", async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .query("EXEC Maqu.TOP5_Solicitudes_Aceptadas");

    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener las top 5 solicitudes:", err.message);
    res
      .status(500)
      .json({
        error: "Error al obtener las solicitudes",
        details: err.message,
      });
  }
});

app.get("/api/solicitudes", async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query("EXEC Maqu.Solicitudes_Todas");

    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener las solicitudes:", err.message);
    res
      .status(500)
      .json({
        error: "Error al obtener las solicitudes",
        details: err.message,
      });
  }
});

app.get("/api/solisrechazadas", async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .query("EXEC Maqu.Solicitudes_Rechazadas");

    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener las solicitudes:", err.message);
    res
      .status(500)
      .json({
        error: "Error al obtener las solicitudes",
        details: err.message,
      });
  }
});

app.get("/api/solisaceptadas", async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .query("EXEC Maqu.Solicitudes_Aceptadas");

    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener las solicitudes:", err.message);
    res
      .status(500)
      .json({
        error: "Error al obtener las solicitudes",
        details: err.message,
      });
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

app.get("/api/Maquinas_Categorias/:cat_ID", async (req, res) => {
  const { cat_ID } = req.params;

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("cat_ID", sql.Int, cat_ID)
      .execute("Maqu.Maquinas_Categorias");

    res.json(result.recordset);
  } catch (error) {
    console.error("Error al buscar máquinas:", error.message);
    res.status(500).send("Error fetching machines by category");
  }
});

app.post("/api/insertarsolicitud", async (req, res) => {
  const {
    titular,
    category,
    brand,
    operationHours,
    description,
    images,
    receipt,
    price,
    phoneNumber,
    additionalPhoneNumber,
    email,
    client,
  } = req.body;

  try {

    
    
    // Validar que haya exactamente 4 imágenes
    if (!images || images.length !== 4) {
      return res.status(400).json({
        message: "Debe subir exactamente 4 imágenes. IMCANT",
      });
    }

    // Validar que se haya subido el comprobante
    if (!receipt) {
      return res.status(400).json({
        message: "Debe subir un comprobante de pago.",
      });
    }

    // Conexión a la base de datos
    const pool = await sql.connect(dbConfig);

    // Ejecutar el procedimiento almacenado
    const result = await pool
      .request()
      .input("cat_ID", sql.Int, category)
      .input("sol_Marca", sql.NVarChar(150), brand)
      .input("sol_Horas", sql.NVarChar(10), operationHours)
      .input("sol_Titular", sql.NVarChar(100), titular)
      .input("sol_Descripcion", sql.NVarChar(sql.MAX), description)
      .input("sol_Precio", sql.NVarChar(20), price || null)
      .input("sol_IMG_1", sql.NVarChar(sql.MAX), images[0] || null)
      .input("sol_IMG_2", sql.NVarChar(sql.MAX), images[1]|| null)
      .input("sol_IMG_3", sql.NVarChar(sql.MAX), images[2]|| null)
      .input("sol_IMG_4", sql.NVarChar(sql.MAX), images[3] || null)
      .input("sol_Comprobante", sql.NVarChar(sql.MAX), receipt ? receipt.url : null)
      .input("sol_NombreCliente", sql.NVarChar(200), client)
      .input("sol_Telefono_1", sql.NVarChar(50), phoneNumber)
      .input("sol_Telefono_2", sql.NVarChar(50), additionalPhoneNumber || null)
      .input("sol_Correo", sql.NVarChar(200), email)
      .execute("Maqu.UPD_InsertarSolicitud");

    // Extraer el ID generado por el procedimiento almacenado
    const solicitudId = result.recordset[0]?.SolicitudID || null;

    res.status(201).json({
      message: "Solicitud creada exitosamente.",
      solicitudId,
    });
  } catch (error) {
    console.error("Error al insertar la solicitud:", error);
    res.status(500).json({
      message: "Error al insertar la solicitud.",
      error: error.message,
    });
  }
});

app.post("/api/insertarsolicitudtemp", async (req, res) => {
  const {
    titular,
    category,
    brand,
    operationHours,
    description,
    images,
    price,
    phoneNumber,
    additionalPhoneNumber,
    email,
    client,
  } = req.body;

  try {
    // Validar que haya exactamente 4 imágenes
    if (!images || images.length !== 4) {
      return res.status(400).json({
        message: "Debe subir exactamente 4 imágenes.",
      });
    }

    // Conexión a la base de datos
    const pool = await sql.connect(dbConfig);

    // Ejecutar el procedimiento almacenado SIN el comprobante de pago
    const result = await pool
      .request()
      .input("cat_ID", sql.Int, category)
      .input("sol_Marca", sql.NVarChar(150), brand)
      .input("sol_Horas", sql.NVarChar(10), operationHours)
      .input("sol_Titular", sql.NVarChar(100), titular)
      .input("sol_Descripcion", sql.NVarChar(sql.MAX), description)
      .input("sol_Precio", sql.NVarChar(20), price || null)
      .input("sol_IMG_1", sql.NVarChar(sql.MAX), images[0] || null)
      .input("sol_IMG_2", sql.NVarChar(sql.MAX), images[1] || null)
      .input("sol_IMG_3", sql.NVarChar(sql.MAX), images[2] || null)
      .input("sol_IMG_4", sql.NVarChar(sql.MAX), images[3] || null)
      .input("sol_Comprobante", sql.NVarChar(sql.MAX), null) 
      .input("sol_NombreCliente", sql.NVarChar(200), client)
      .input("sol_Telefono_1", sql.NVarChar(50), phoneNumber)
      .input("sol_Telefono_2", sql.NVarChar(50), additionalPhoneNumber || null)
      .input("sol_Correo", sql.NVarChar(200), email)
      .execute("Maqu.UPD_InsertarSolicitud");

   
    const solicitudId = result.recordset[0]?.SolicitudID || null;

    res.status(201).json({
      message: "Solicitud creada exitosamente.",
      solicitudId,
    });
  } catch (error) {
    console.error("Error al insertar la solicitud:", error);
    res.status(500).json({
      message: "Error al insertar la solicitud.",
      error: error.message,
    });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const pool = await sql.connect(dbConfig);

    const result = await pool
      .request()
      .input("usua_Email", sql.VarChar(100), email)
      .input("usua_Password", sql.NVarChar(sql.MAX), password)
      .execute("Acce.USP_VerificarUsuario");

    
    if (result.recordset.length === 0) {
      return res.status(401).json({ message: "Credenciales incorrectas o usuario inactivo" });
    }

    const user = result.recordset[0];

    res.status(200).json({
      message: "Inicio de sesión exitoso",
      user: {
        id: user.usua_ID,
        name: user.usua_Nombre,
        email: user.usua_Email,
      },
    });

  } catch (error) {
    console.error("Error en el login:", error);
    res.status(500).json({ message: "Error en el servidor", error: error.message });
  }
});

app.post("/api/rechazarsolicitud", async (req, res) => {
  const { sol_ID, rejection} = req.body;

  try {
    const pool = await sql.connect(dbConfig);

    // Ejecutar el procedimiento almacenado
    const result = await pool
      .request()
      .input("sol_ID", sql.Int, sol_ID)
      .input("sol_Motivo", sql.NVarChar(sql.MAX), rejection)
      .execute("Maqu.Rechazar_Solicitud");

    res.status(201).json({
      message: "Solicitud Rechazada Existosamente.",
    });
  } catch (error) {
    console.error("Error al rechazar la solicitud:", error);
    res.status(500).json({
      message: "Error al rechazar la solicitud. 500",
      error: error.message,
    });
  }
});

app.get("/api/solicitud_detalles", async (req, res) => {
  const { sol_ID } = req.query; // Tomamos el parámetro de la URL

  try {
    const pool = await sql.connect(dbConfig);

    // Ejecutar el procedimiento almacenado para obtener los detalles de la máquina
    const result = await pool
      .request()
      .input("sol_ID", sql.Int, sol_ID)
      .execute("Maqu.Solicitud_Detalles_VerMas");

    if (result.recordset.length > 0) {
      // Si la máquina existe, devuelve los datos
      res.status(200).json(result.recordset[0]);
    } else {
      res.status(404).json({ message: "Máquina no encontrada" });
    }
  } catch (error) {
    console.error("Error al obtener los detalles de la máquina:", error);
    res.status(500).json({
      message: "Error al obtener los detalles de la máquina. 500",
      error: error.message,
    });
  }
});

app.post("/api/insertar_categorias", async (req, res) => {
  try {
    const { cat_Nombre, cat_Imagen } = req.body;

    if (!cat_Nombre || !cat_Imagen) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    const query = `
      EXEC Maqu.Insertar_Categoria @cat_Nombre = ?, @cat_Imagen = ?;
    `;

    await pool.request()
      .input("cat_Nombre", sql.VarChar(100), cat_Nombre)
      .input("cat_Imagen", sql.VarChar(255), cat_Imagen)
      .query(query);

    res.status(201).json({ message: "Categoría insertada correctamente" });
  } catch (error) {
    console.error("Error al insertar categoría:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.post("/api/actualizar_categorias", async (req, res) => {
  try {
    const { cat_ID, cat_Nombre, cat_Imagen } = req.body;

    if (!cat_ID || !cat_Nombre || !cat_Imagen) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    const query = `
      EXEC Maqu.Actualizar_Categoria @cat_ID = ?, @cat_Nombre = ?, @cat_Imagen = ?;
    `;

    await pool.request()
      .input("cat_ID",     sql.Int,          cat_ID)
      .input("cat_Nombre", sql.VarChar(100), cat_Nombre)
      .input("cat_Imagen", sql.VarChar(255), cat_Imagen)
      .query(query);

    res.status(201).json({ message: "Categoría actualizada correctamente" });
  } catch (error) {
    console.error("Error al actualizar categoría:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});


app.listen(port, () => {
  console.log(`Servidor backend escuchando en http://localhost:${port}`);
});
