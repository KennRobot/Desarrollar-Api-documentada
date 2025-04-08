import express from 'express';
import {
  getProgress,
  updateProgress,
  subirNivel,
  getGlobalRanking,
  addLogros
} from '../controllers/progressController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @openapi
 * /{id}/progreso:
 *   get:
 *     tags:
 *       - Progress
 *     summary: Obtener progreso del jugador
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del jugador
 *     responses:
 *       '200':
 *         description: Datos de progreso
 *       '404':
 *         description: Usuario no encontrado
 */
router.get('/:id/progreso', authenticateToken, getProgress);

/**
 * @openapi
 * /global/ranking:
 *   get:
 *     tags:
 *       - Progress
 *     summary: Obtener ranking global
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista de ranking
 */
router.get('/global/ranking', authenticateToken, getGlobalRanking);

/**
 * @openapi
 * /{id}/addLogros:
 *   post:
 *     tags:
 *       - Progress
 *     summary: Agregar logros a jugador
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/Logro'
 *     responses:
 *       '200':
 *         description: Logros agregados
 *       '422':
 *         description: Error al agregar
 */
router.post('/:id/addLogros', authenticateToken, addLogros);

/**
 * @openapi
 * /{id}/progreso:
 *   put:
 *     tags:
 *       - Progress
 *     summary: Actualizar experiencia
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               experiencia:
 *                 type: integer
 *     responses:
 *       '200':
 *         description: Experiencia actualizada
 *       '400':
 *         description: Datos inválidos
 */
router.put('/:id/progreso', authenticateToken, updateProgress);

/**
 * @openapi
 * /{id}/subirNivel:
 *   post:
 *     tags:
 *       - Progress
 *     summary: Subir nivel del jugador
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Nivel subido
 *       '422':
 *         description: No hay experiencia suficiente
 */
router.post('/:id/subirNivel', authenticateToken, subirNivel);

export default router;
