const express = require('express');
const router = express.Router();
const categoriaRepo = require('../repositories/categoriaRepository');

/**
 * Obtener todas las categorías (admin)
 * GET /api/admin/categorias
 */
router.get('/categorias', async (req, res) => {
  try {
    const categorias = await categoriaRepo.getAllCategorias();
    res.json(categorias);
  } catch (err) {
    console.error('Error al obtener categorías:', err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * Obtener categorías activas (público)
 * GET /api/categorias/activas
 */
router.get('/activas', async (req, res) => {
  try {
    const categorias = await categoriaRepo.getActiveCategorias();
    res.json(categorias);
  } catch (err) {
    console.error('Error al obtener categorías activas:', err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * Crear nueva categoría
 * POST /api/admin/categorias
 */
router.post('/categorias', async (req, res) => {
  try {
    const { nombre, descripcion, icono } = req.body;

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ message: 'El nombre es requerido' });
    }

    const result = await categoriaRepo.createCategoria({
      nombre: nombre.trim(),
      descripcion: descripcion?.trim(),
      icono: icono?.trim() || 'bi-tools'
    });

    res.json({ message: 'Categoría creada exitosamente', id: result.id });
  } catch (err) {
    console.error('Error al crear categoría:', err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * Actualizar categoría
 * PUT /api/admin/categorias/:id
 */
router.put('/categorias/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { nombre, descripcion, icono } = req.body;

    await categoriaRepo.updateCategoria(id, {
      nombre: nombre?.trim(),
      descripcion: descripcion?.trim(),
      icono: icono?.trim()
    });

    res.json({ message: 'Categoría actualizada exitosamente' });
  } catch (err) {
    console.error('Error al actualizar categoría:', err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * Desactivar categoría (soft delete)
 * POST /api/admin/categorias/:id/desactivar
 */
router.post('/categorias/:id/desactivar', async (req, res) => {
  try {
    const id = req.params.id;
    await categoriaRepo.deleteCategoria(id);
    res.json({ message: 'Categoría desactivada exitosamente' });
  } catch (err) {
    console.error('Error al desactivar categoría:', err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * Activar categoría
 * POST /api/admin/categorias/:id/activar
 */
router.post('/categorias/:id/activar', async (req, res) => {
  try {
    const id = req.params.id;
    await categoriaRepo.activateCategoria(id);
    res.json({ message: 'Categoría activada exitosamente' });
  } catch (err) {
    console.error('Error al activar categoría:', err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * Eliminar permanentemente categoría
 * DELETE /api/admin/categorias/:id
 */
router.delete('/categorias/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await categoriaRepo.permanentDeleteCategoria(id);
    res.json({ message: 'Categoría eliminada permanentemente' });
  } catch (err) {
    console.error('Error al eliminar categoría:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
