import db from "../models/firebase.js"; // Configuración de Firebase
import { collection, doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";

// Clave secreta para JWT (deberías moverla a variables de entorno)
const JWT_SECRET = "team2"; 

// 🔹 Registrar un nuevo usuario
export const registerUser = async (req, res) => {
    try {
        const { nombre, email, password, nivel = 1, experiencia = 0, logros = [], ranking = 0, amigos = [], solicitudes_pendientes = [] } = req.body;

        // Validación básica
        if (!nombre || !email || !password) {
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
        }

        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear usuario en Firebase Firestore
        const userRef = doc(collection(db, "players"));
        await setDoc(userRef, {
            nombre,
            email,
            password: hashedPassword,
            nivel,
            experiencia,
            logros,
            ranking,
            amigos,
            solicitudes_pendientes
        });

        res.status(201).json({ message: "Usuario registrado con éxito", id: userRef.id });
    } catch (error) {
        console.error("Error registrando usuario:", error);
        res.status(500).json({ error: "Error registrando usuario" });
    }
};

// 🔹 Iniciar sesión y obtener token
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validación básica
        if (!email || !password) {
            return res.status(400).json({ error: "Email y contraseña son obligatorios" });
        }

        // Buscar usuario en Firestore
        const usersRef = collection(db, "players");
        const snapshot = await getDocs(usersRef);
        const userDoc = snapshot.docs.find(doc => doc.data().email === email);

        if (!userDoc) {
            return res.status(401).json({ error: "Credenciales incorrectas" });
        }

        const user = userDoc.data();

        // Verificar contraseña
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Credenciales incorrectas" });
        }

        // Generar Token JWT
        const token = jwt.sign({ id: userDoc.id, email: user.email }, JWT_SECRET, { expiresIn: "2h" });

        res.status(200).json({ message: "Login exitoso", token, userId: userDoc.id });
    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ error: "Error en login" });
    }
};

// 🔹 Obtener usuario por ID
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const userRef = doc(db, "players", id);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const user = userSnap.data();
        delete user.password; // No enviar contraseña

        res.status(200).json(user);
    } catch (error) {
        console.error("Error obteniendo usuario:", error);
        res.status(500).json({ error: "Error obteniendo usuario" });
    }
};

// 🔹 Actualizar usuario completamente (PUT)
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, email, nivel, experiencia, logros, ranking, amigos, solicitudes_pendientes } = req.body;

        const userRef = doc(db, "players", id);
        await updateDoc(userRef, { nombre, email, nivel, experiencia, logros, ranking, amigos, solicitudes_pendientes });

        res.status(200).json({ message: "Usuario actualizado correctamente" });
    } catch (error) {
        console.error("Error actualizando usuario:", error);
        res.status(500).json({ error: "Error actualizando usuario" });
    }
};

// 🔹 Actualizar usuario parcialmente (PATCH)
export const patchUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body; // Solo actualizar los campos enviados

        const userRef = doc(db, "players", id);
        await updateDoc(userRef, updates);

        res.status(200).json({ message: "Usuario actualizado parcialmente" });
    } catch (error) {
        console.error("Error actualizando usuario parcialmente:", error);
        res.status(500).json({ error: "Error actualizando usuario parcialmente" });
    }
};

// 🔹 Eliminar usuario (DELETE)
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const userRef = doc(db, "players", id);

        await deleteDoc(userRef);
        res.status(200).json({ message: "Usuario eliminado correctamente" });
    } catch (error) {
        console.error("Error eliminando usuario:", error);
        res.status(500).json({ error: "Error eliminando usuario" });
    }
};
