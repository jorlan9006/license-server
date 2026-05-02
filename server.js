const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(cors());

app.use(express.json());


// 🔥 CONEXIÓN POSTGRESQL
const pool = new Pool({

  host: process.env.PGHOST,

  port: process.env.PGPORT,

  database: process.env.PGDATABASE,

  user: process.env.PGUSER,

  password: process.env.PGPASSWORD,

  ssl: {
    rejectUnauthorized: false
  }
});


// 🔐 VALIDAR LICENCIA
app.post("/validate", async (req, res) => {

  try {

    const {
      licenseKey,
      machineId
    } = req.body;

    console.log(
      "🔥 VALIDANDO:",
      licenseKey
    );

    // 🚫 datos incompletos
    if (!licenseKey || !machineId) {

      return res.json({
        success: false,
        message: "Datos incompletos"
      });
    }

    // 🔥 buscar licencia
    const result = await pool.query(

      "SELECT * FROM licenses WHERE license_key = $1",

      [licenseKey]
    );

    // 🚫 no existe
    if (result.rows.length === 0) {

      return res.json({
        success: false,
        message: "Licencia inválida"
      });
    }

    const license =
      result.rows[0];

    // 🚫 desactivada
    if (!license.active) {

      return res.json({
        success: false,
        message: "Licencia desactivada"
      });
    }

    // 🚫 expirada
    if (
      license.expires_at &&
      new Date() >
      new Date(license.expires_at)
    ) {

      return res.json({
        success: false,
        message: "Licencia expirada"
      });
    }

    // 🔥 primera activación
    if (!license.machine_id) {

      await pool.query(

        `UPDATE licenses
         SET machine_id = $1,
             last_login = NOW()
         WHERE id = $2`,

        [
          machineId,
          license.id
        ]
      );

      return res.json({
        success: true,
        message: "Licencia activada"
      });
    }

    // 🚫 otro PC
    if (
      license.machine_id !==
      machineId
    ) {

      return res.json({
        success: false,
        message:
          "Licencia usada en otro PC"
      });
    }

    // ✅ válida
    await pool.query(

      `UPDATE licenses
       SET last_login = NOW()
       WHERE id = $1`,

      [license.id]
    );

    return res.json({
      success: true,
      message: "Licencia válida"
    });

  } catch (e) {

    console.log(e);

    return res.json({
      success: false,
      message: "Error servidor"
    });
  }
});


// 🚀 START SERVER
const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    "🚀 License Server Running"
  );
});

