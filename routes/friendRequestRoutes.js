import express from 'express';
import { 
  createFriendRequest, 
  getFriendRequestById,
  getFriendRequestByUser, 
  updateFriendRequest, 
  deleteFriendRequest,
  getAllFriendRequests 
} from '../controllers/friendRequestController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Registrar una solicitud de amistad (POST) - requiere token
router.post('/solicitud', authenticateToken, createFriendRequest);

// Obtener todas las solicitudes de amistad
router.get('/obtener/solicitud', authenticateToken, getAllFriendRequests);

// Obtener solicitudes de amistad de un usuario
router.get('/solicitud/:id', authenticateToken, getFriendRequestById);

// Obtener solicitudes de amistad de un usuario
router.get('/solicitud/usuario/:id', authenticateToken, getFriendRequestByUser);

// Actualizar el estado de una solicitud (PATCH) - requiere token
router.patch('/solicitud/:id', authenticateToken, updateFriendRequest);

// Eliminar una solicitud (DELETE) - requiere token
router.delete('/solicitud/:id', authenticateToken, deleteFriendRequest);

export default router;
