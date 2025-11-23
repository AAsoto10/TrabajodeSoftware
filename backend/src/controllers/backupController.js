const express = require('express');
const router = express.Router();
const backupService = require('../services/backupService');

// GET /api/admin/backups - Listar todos los backups
router.get('/backups', async (req, res) => {
  try {
    const backups = backupService.listBackups();
    res.json({ 
      success: true, 
      count: backups.length,
      backups 
    });
  } catch (err) {
    console.error('Error al listar backups:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/backups/create - Crear un nuevo backup manualmente
router.post('/backups/create', async (req, res) => {
  try {
    const backupPath = await backupService.createBackup();
    backupService.cleanOldBackups(10);
    res.json({ 
      success: true, 
      message: 'Backup creado exitosamente',
      backupPath 
    });
  } catch (err) {
    console.error('Error al crear backup:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/backups/restore - Restaurar un backup específico
router.post('/backups/restore', async (req, res) => {
  try {
    const { backupFileName } = req.body;
    if (!backupFileName) {
      return res.status(400).json({ success: false, message: 'Nombre de backup requerido' });
    }

    await backupService.restoreBackup(backupFileName);
    res.json({ 
      success: true, 
      message: 'Base de datos restaurada exitosamente. Se recomienda reiniciar el servidor.' 
    });
  } catch (err) {
    console.error('Error al restaurar backup:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/backups/:fileName - Eliminar un backup específico
router.delete('/backups/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(backupService.BACKUP_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Backup no encontrado' });
    }

    fs.unlinkSync(filePath);
    res.json({ 
      success: true, 
      message: 'Backup eliminado exitosamente' 
    });
  } catch (err) {
    console.error('Error al eliminar backup:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
