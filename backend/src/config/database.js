const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', '..', 'database.db');

let db;

async function initDB(){
  db = await open({ filename: DB_PATH, driver: sqlite3.Database });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT,
      estado_validacion TEXT DEFAULT 'aprobado',
      categoria TEXT,
      saldo REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER,
      profesional_id INTEGER,
      categoria TEXT,
      descripcion TEXT,
      precio REAL,
      estado TEXT DEFAULT 'pendiente',
      fechaHora TEXT,
      direccion TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      categoria TEXT,
      tarifa REAL,
      zona TEXT,
      biografia TEXT,
      certificados TEXT,
      avatar TEXT,
      estado_validacion TEXT DEFAULT 'pendiente',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS commissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER,
      amount REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER,
      profesional_id INTEGER,
      cliente_id INTEGER,
      rating INTEGER,
      comentario TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed admin - INSERT OR IGNORE via checking existence
  const adminEmail = 'admin@hogarfix.local';
  const existing = await db.get('SELECT id FROM users WHERE email = ?', adminEmail);
  if (!existing) {
    const hash = bcrypt.hashSync('admin123', 10);
    await db.run('INSERT INTO users (nombre,email,password,role,estado_validacion) VALUES (?,?,?,?,?)', ['Admin','admin@hogarfix.local', hash, 'admin','aprobado']);
    console.log('Admin seed creado: admin@hogarfix.local / admin123');
  }
  // Ensure categoria column exists for older DBs
  try{
    await db.run("ALTER TABLE users ADD COLUMN categoria TEXT");
  }catch(e){ /* ignore if column exists */ }
  // Ensure professional profile columns exist
  try{ await db.run("ALTER TABLE users ADD COLUMN tarifa REAL"); }catch(e){}
  try{ await db.run("ALTER TABLE users ADD COLUMN zona TEXT"); }catch(e){}
  try{ await db.run("ALTER TABLE users ADD COLUMN biografia TEXT"); }catch(e){}
  try{ await db.run("ALTER TABLE users ADD COLUMN certificados TEXT"); }catch(e){}
  try{ await db.run("ALTER TABLE users ADD COLUMN avatar TEXT"); }catch(e){}
  try{ await db.run("ALTER TABLE users ADD COLUMN activo INTEGER DEFAULT 1"); }catch(e){}
  try{ await db.run("ALTER TABLE users ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP"); }catch(e){}

  // Ensure pedidos has fechaHora and direccion for new features
  try{ await db.run("ALTER TABLE pedidos ADD COLUMN fechaHora TEXT"); }catch(e){}
  try{ await db.run("ALTER TABLE pedidos ADD COLUMN direccion TEXT"); }catch(e){}

  // Migrate existing single-user profiles into new `profiles` table (if any)
  try{
    const usersWithProfile = await db.all("SELECT id,categoria,tarifa,zona,biografia,certificados,avatar FROM users WHERE categoria IS NOT NULL AND categoria <> ''");
    for (const u of usersWithProfile){
      // check if a similar profile already exists
      const existing = await db.get('SELECT id FROM profiles WHERE user_id = ? AND lower(categoria) = lower(?)', [u.id, u.categoria]);
      if (!existing){
        await db.run('INSERT INTO profiles (user_id,categoria,tarifa,zona,biografia,certificados,avatar,estado_validacion) VALUES (?,?,?,?,?,?,?,?)', [u.id, u.categoria, u.tarifa || 0, u.zona || null, u.biografia || null, u.certificados || null, u.avatar || null, 'aprobado']);
      }
    }
  }catch(e){ console.warn('Profile migration skipped or failed', e.message); }
}

function getDB(){
  if (!db) throw new Error('DB no inicializada. Llama initDB primero');
  return db;
}

module.exports = { initDB, getDB };
