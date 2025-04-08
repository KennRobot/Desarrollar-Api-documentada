import express from 'express';
import {
  createFriendRequest,
  getAllFriendRequests,
  getFriendRequestById,
  getFriendRequestByUser,
  updateFriendRequest,
  deleteFriendRequest
} from '../controllers/friendRequestController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @openapi
 * /solicitud:
 *   post:
 *     tags:
 *       - Friend Requests
 *     summary: Registrar una solicitud de amistad
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: IDs de emisor y receptor
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - de_usuario_id
 *               - para_usuario_id
 *             properties:
 *               de_usuario_id:
 *                 type: string
 *               para_usuario_id:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Solicitud creada correctamente
 *       '400':
 *         description: Error en datos de entrada
 */
router.post('/solicitud', authenticateToken, createFriendRequest);

/**
 * @openapi
 * /obtener/solicitud:
 *   get:
 *     tags:
 *       - Friend Requests
 *     summary: Obtener todas las solicitudes de amistad
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista de solicitudes
 *       '404':
 *         description: No se encontraron solicitudes
 */
router.get('/obtener/solicitud', authenticateToken, getAllFriendRequests);

/**
 * @openapi
 * /solicitud/{id}:
 *   get:
 *     tags:
 *       - Friend Requests
 *     summary: Obtener solicitud por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la solicitud
 *     responses:
 *       '200':
 *         description: Datos de la solicitud
 *       '404':
 *         description: Solicitud no encontrada
 */
router.get('/solicitud/:id', authenticateToken, getFriendRequestById);

/**
 * @openapi
 * /solicitud/usuario/{id}:
 *   get:
 *     tags:
 *       - Friend Requests
 *     summary: Obtener solicitudes de un usuario
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del usuario receptor
 *     responses:
 *       '200':
 *         description: Lista de solicitudes del usuario
 *       '404':
 *         description: Usuario no encontrado
 */
router.get('/solicitud/usuario/:id', authenticateToken, getFriendRequestByUser);

/**
 * @openapi
 * /solicitud/{id}:
 *   patch:
 *     tags:
 *       - Friend Requests
 *     summary: Actualizar estado de solicitud
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la solicitud
 *     requestBody:
 *       description: Nuevo estado ("aceptada" o "rechazada")
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [aceptada, rechazada]
 *     responses:
 *       '200':
 *         description: Estado actualizado
 *       '400':
 *         description: Estado inválido o solicitud ya procesada
 */
router.patch('/solicitud/:id', authenticateToken, updateFriendRequest);

/**
 * @openapi
 * /solicitud/{id}:
 *   delete:
 *     tags:
 *       - Friend Requests
 *     summary: Eliminar una solicitud
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de la solicitud
 *     responses:
 *       '200':
 *         description: Solicitud eliminada correctamente
 *       '403':
 *         description: No autorizado
 */
router.delete('/solicitud/:id', authenticateToken, deleteFriendRequest);

export default router;
