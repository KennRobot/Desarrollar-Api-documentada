import express from 'express';
import { getProgress, updateProgress, subirNivel, getGlobalRanking, addLogros } from '../controllers/progressController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Obtener el progreso del jugador
router.get('/:id/progreso', authenticateToken, getProgress);

// Obtener el progreso del jugador 
router.get('/global/ranking', authenticateToken, getGlobalRanking);

// Obtener el progreso del jugador 
router.post('/:id/addLogros', authenticateToken, addLogros);

// Actualizar nivel y experiencia (PUT) 
router.put('/:id/progreso', authenticateToken, updateProgress);

// Subir el nivel del jugador (POST) 
router.post('/:id/subirNivel', authenticateToken, subirNivel);

export default router;
