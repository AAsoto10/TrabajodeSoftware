const fs = require('fs');
const path = require('path');
const { getDB } = require('../config/database');

const BACKUP_DIR = path.join(__dirname, '..', '..', 'backups');
const DB_PATH = path.join(__dirname, '..', '..', 'database.db');

// Crear directorio de backups si no existe
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log('📁 Directorio de backups creado');
}

/**
 * Crea un backup de la base de datos
 * @returns {Promise<string>} Ruta del archivo de backup creado
 */
async function createBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFileName = `database-backup-${timestamp}.db`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    // Usar el comando VACUUM INTO de SQLite para crear backup
    const db = getDB();
    await db.run(`VACUUM INTO '${backupPath.replace(/\\/g, '/')}'`);

    const stats = fs.statSync(backupPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`✅ Backup creado: ${backupFileName} (${fileSizeMB} MB)`);
    return backupPath;
  } catch (err) {
    console.error('❌ Error al crear backup:', err.message);
    throw err;
  }
}

/**
 * Limpia backups antiguos, dejando solo los últimos N
 * @param {number} keepCount - Cantidad de backups a mantener
 */
function cleanOldBackups(keepCount = 10) {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('database-backup-') && f.endsWith('.db'))
      .map(f => ({
        name: f,
        path: path.join(BACKUP_DIR, f),
        time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > keepCount) {
      const toDelete = files.slice(keepCount);
      toDelete.forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`🗑️  Backup antiguo eliminado: ${file.name}`);
      });
    }
  } catch (err) {
    console.error('⚠️  Error al limpiar backups antiguos:', err.message);
  }
}

/**
 * Lista todos los backups disponibles
 * @returns {Array} Lista de backups con información
 */
function listBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('database-backup-') && f.endsWith('.db'))
      .map(f => {
        const filePath = path.join(BACKUP_DIR, f);
        const stats = fs.statSync(filePath);
        return {
          name: f,
          path: filePath,
          size: stats.size,
          sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
      .sort((a, b) => b.modified.getTime() - a.modified.getTime());

    return files;
  } catch (err) {
    console.error('❌ Error al listar backups:', err.message);
    return [];
  }
}

/**
 * Restaura un backup específico
 * @param {string} backupFileName - Nombre del archivo de backup
 * @returns {Promise<void>}
 */
async function restoreBackup(backupFileName) {
  try {
    const backupPath = path.join(BACKUP_DIR, backupFileName);
    
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup no encontrado: ${backupFileName}`);
    }

    // Crear backup de seguridad antes de restaurar
    const safetyBackup = `database-before-restore-${Date.now()}.db`;
    fs.copyFileSync(DB_PATH, path.join(BACKUP_DIR, safetyBackup));
    console.log(`💾 Backup de seguridad creado: ${safetyBackup}`);

    // Restaurar el backup
    fs.copyFileSync(backupPath, DB_PATH);
    console.log(`✅ Base de datos restaurada desde: ${backupFileName}`);
  } catch (err) {
    console.error('❌ Error al restaurar backup:', err.message);
    throw err;
  }
}

/**
 * Programa backups automáticos
 * @param {number} intervalHours - Intervalo en horas entre backups
 * @param {number} keepCount - Cantidad de backups a mantener
 */
function scheduleBackups(intervalHours = 24, keepCount = 10) {
  const intervalMs = intervalHours * 60 * 60 * 1000;

  // Crear backup inicial
  createBackup().then(() => {
    cleanOldBackups(keepCount);
  });

  // Programar backups periódicos
  setInterval(() => {
    createBackup().then(() => {
      cleanOldBackups(keepCount);
    });
  }, intervalMs);

  console.log(`⏰ Backups automáticos programados cada ${intervalHours} horas (mantener últimos ${keepCount})`);
}

module.exports = {
  createBackup,
  cleanOldBackups,
  listBackups,
  restoreBackup,
  scheduleBackups,
  BACKUP_DIR
};
