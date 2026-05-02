require("dotenv").config();

const express = require("express");

const { Pool } = require("pg");

const app = express();

app.use(express.json());


// 🔥 PostgreSQL Railway
const pool = new Pool({

  host:
    process.env.PGHOST,

  port:
    process.env.PGPORT,

  database:
    process.env.PGDATABASE,

  user:
    process.env.PGUSER,

  password:
    process.env.PGPASSWORD,

  ssl: {
    rejectUnauthorized: false
  }
});



// 🚀 VALIDAR LICENCIA
app.post(

  "/validate",

  async (req, res) => {

    try {

      const {

        licenseKey,
        machineId

      } = req.body;

      console.log(
        "🔥 VALIDANDO:",
        licenseKey
      );

      // 🔍 buscar licencia
      const result =
        await pool.query(

          `
          SELECT *
          FROM licenses
          WHERE license_key = $1
          `,

          [licenseKey]
        );

      // ❌ no existe
      if (
        result.rows.length === 0
      ) {

        return res.json({

          success: false,

          message:
            "Licencia inválida"
        });
      }

      const license =
        result.rows[0];

      // ❌ desactivada
      if (!license.active) {

        return res.json({

          success: false,

          message:
            "Licencia desactivada"
        });
      }

      // 🔒 primera activación
      if (!license.machine_id) {

        await pool.query(

          `
          UPDATE licenses
          SET machine_id = $1
          WHERE id = $2
          `,

          [
            machineId,
            license.id
          ]
        );

        return res.json({

          success: true,

          message:
            "Licencia activada"
        });
      }

      // ❌ otro PC
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

      // ✅ correcta
      res.json({

        success: true,

        message:
          "Licencia válida"
      });

    } catch (e) {

      console.log(e);

      res.json({

        success: false,

        message:
          "Error servidor"
      });
    }
  }
);


app.listen(

  process.env.PORT || 3000,

  () => {

    console.log(
      "🚀 License Server Running"
    );
  }
);
