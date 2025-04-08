import express from 'express';
import {
  registerUser,
  loginUser,
  getUserById,
  updateUser,
  patchUser,
  deleteUser,
  getAllUsers
} from '../controllers/usersControllers.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @openapi
 * /register:
 *   post:
 *     tags:
 *       - Users
 *     summary: Registrar un nuevo usuario
 *     requestBody:
 *       description: Datos de registro de usuario
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - email
 *               - password
 *               - confirmPassword
 *               - edad
 *             properties:
 *               nombre:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *               edad:
 *                 type: integer
 *               nivel:
 *                 type: integer
 *                 default: 1
 *               experiencia:
 *                 type: integer
 *                 default: 0
 *     responses:
 *       '200':
 *         description: Usuario registrado con éxito
 *       '400':
 *         description: Faltan campos obligatorios o usuario ya existe
 *       '422':
 *         description: Validación de datos fallida
 */
router.post('/register', registerUser);

/**
 * @openapi
 * /login:
 *   post:
 *     tags:
 *       - Users
 *     summary: Iniciar sesión y obtener token JWT
 *     requestBody:
 *       description: Credenciales de usuario
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Login exitoso, retorna token y datos de usuario
 *       '400':
 *         description: Faltan email o contraseña
 *       '401':
 *         description: Credenciales incorrectas
 *       '422':
 *         description: Error interno de login
 */
router.post('/login', loginUser);

/**
 * @openapi
 * /{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Obtener usuario por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       '200':
 *         description: Información del usuario (sin password)
 *       '400':
 *         description: ID no proporcionado
 *       '403':
 *         description: No autorizado (token faltante o inválido)
 *       '404':
 *         description: Usuario no encontrado
 */
router.get('/:id', authenticateToken, getUserById);

/**
 * @openapi
 * /{id}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Reemplazar completamente datos de un usuario
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     requestBody:
 *       description: Campos completos para reemplazo
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdate'
 *     responses:
 *       '200':
 *         description: Usuario actualizado correctamente
 *       '400':
 *         description: Body vacío o formato inválido
 *       '404':
 *         description: Usuario no encontrado
 */
router.put('/:id', authenticateToken, updateUser);

/**
 * @openapi
 * /{id}:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Actualizar parcialmente datos de un usuario
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     requestBody:
 *       description: Campos a modificar
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       '200':
 *         description: Usuario actualizado parcialmente
 *       '400':
 *         description: Body vacío o datos inválidos
 *       '404':
 *         description: Usuario no encontrado
 */
router.patch('/:id', authenticateToken, patchUser);

/**
 * @openapi
 * /{id}:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Eliminar un usuario
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       '200':
 *         description: Usuario eliminado correctamente
 *       '400':
 *         description: ID no proporcionado
 *       '404':
 *         description: Usuario no encontrado
 */
router.delete('/:id', authenticateToken, deleteUser);

/**
 * @openapi
 * /:
 *   get:
 *     tags:
 *       - Users
 *     summary: Obtener todos los usuarios
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista de usuarios
 */
router.get('/', authenticateToken, getAllUsers);

export default router;
