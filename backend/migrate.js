const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function migrate() {
  const db = await open({ 
    filename: './database.db', 
    driver: sqlite3.Database 
  });

  try {
    // Agregar columnas nuevas si no existen
    await db.exec(`
      ALTER TABLE users ADD COLUMN foto_ci TEXT;
    `).catch(() => console.log('Columna foto_ci ya existe'));
    
    await db.exec(`
      ALTER TABLE users ADD COLUMN motivacion TEXT;
    `).catch(() => console.log('Columna motivacion ya existe'));
    
    await db.exec(`
      ALTER TABLE users ADD COLUMN activo INTEGER DEFAULT 1;
    `).catch(() => console.log('Columna activo ya existe'));

    await db.exec(`
      ALTER TABLE users ADD COLUMN qr_pago TEXT;
    `).catch(() => console.log('Columna qr_pago ya existe'));

    console.log('✅ Migración completada exitosamente');
  } catch (err) {
    console.error('Error en migración:', err.message);
  } finally {
    await db.close();
  }
}

migrate();
