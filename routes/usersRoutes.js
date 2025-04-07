import express from 'express';
import { 
  registerUser, 
  loginUser, 
  getUserById, 
  updateUser, 
  patchUser, 
  deleteUser 
} from '../controllers/usersControllers.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Registrar un nuevo jugador
router.post('/register', registerUser);

// Iniciar sesión y obtener token
router.post('/login', loginUser);

// Obtener datos de un usuario (requiere token)
router.get('/:id', authenticateToken, getUserById);

// Actualizar información del jugador (PUT) - requiere token
router.put('/:id', authenticateToken, updateUser);

// Actualizar información del jugador parcialmente (PATCH) - requiere token
router.patch('/:id', authenticateToken, patchUser);

// Eliminar un usuario (DELETE) - requiere token
router.delete('/:id', authenticateToken, deleteUser);

export default router;
