import db from "../models/firebase.js"; // Configuración de Firebase
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, deleteDoc } from "firebase/firestore";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


// Clave secreta para JWT (deberías moverla a variables de entorno)
const JWT_SECRET = "team2"; 

// 🔹 Registrar un nuevo usuario
export const registerUser = async (req, res) => {
    try {
        // Validar que el cuerpo de la solicitud sea un objeto JSON válido
        if (!req.body || typeof req.body !== "object") {
            return res.status(400).json({ error: "El cuerpo de la solicitud debe ser un objeto JSON válido" });
        }

        // Desestructurar campos, agregando confirmPassword y edad para las validaciones extra
        const { 
            nombre, 
            email, 
            password, 
            confirmPassword, 
            edad, 
            nivel = 1, 
            experiencia = 0, 
            logros = [], 
            ranking = 0, 
            amigos = [], 
            solicitudes_pendientes = [] 
        } = req.body;

        // Validación básica de campos obligatorios
        if (!nombre || !email || !password || !confirmPassword || edad === undefined) {
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
        }

        // Validar que las contraseñas coincidan
        if (password !== confirmPassword) {
            return res.status(422).json({ error: "Las contraseñas no coinciden" });
        }

        // Validar que el usuario sea mayor de 13 años
        if (edad < 13) {
            return res.status(422).json({ error: "Debes ser mayor de 13 años para registrarte" });
        }

        // Verificar si el usuario con el mismo correo ya existe
        const usersQuery = query(collection(db, "players"), where("email", "==", email));
        const querySnapshot = await getDocs(usersQuery);
        if (!querySnapshot.empty) {
            return res.status(400).json({ error: "El usuario con este correo ya existe" });
        }

        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear usuario en Firebase Firestore
        const userRef = doc(collection(db, "players"));
        await setDoc(userRef, {
            nombre,
            email,
            password: hashedPassword,
            edad, // Se almacena la edad
            nivel,
            experiencia,
            logros,
            ranking,
            amigos,
            solicitudes_pendientes
        });

        // Respuesta de éxito: retorna la llave de acceso en un array de objetos
        return res.status(200).json({ data: [{ accessKey: userRef.id }] });
    } catch (error) {
        console.error("Error registrando usuario:", error);
        return res.status(422).json({ error: "No se pudo crear el usuario por datos invalidos." });
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

        res.status(200).json({ message: "Login exitoso", token, userId: userDoc.id, nombre: userDoc.nombre });
    } catch (error) {
        console.error("Error en login:", error);
        res.status(422).json({ error: "Error en login" });
    }
};

// 🔹 Obtener usuario por ID
export const getUserById = async (req, res) => {
    try {
        // Validar que se haya enviado el ID del usuario
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "El ID del usuario es requerido" });
        }

        // Validar que exista el token y que el usuario tenga permiso para ver la información
        // Se asume que la validación del JWT se realiza en un middleware previo, que agrega req.user
        if (!req.user) {
            return res.status(403).json({ error: "No tienes permiso para ver esta información" });
        }

        // Obtener el documento del usuario en Firestore
        const userRef = doc(db, "players", id);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const user = userSnap.data();
        delete user.password; // No enviar la contraseña

        // Respuesta de éxito: se retorna la información del usuario en un array de objetos
        return res.status(200).json({ data: [user] });
    } catch (error) {
        console.error("Error obteniendo usuario:", error);
        return res.status(422).json({ error: "Error al obtener el usuario" });
    }
};


// 🔹 Actualizar usuario completamente (PUT)
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Se asume que la autorización JWT se valida en un middleware previo
        // Validar que se hayan enviado datos para actualizar
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ error: "No se proporcionaron datos para actualizar" });
        }

        // Extraer los campos que se permiten actualizar (incluyendo password si se desea actualizar)
        const {
            nombre,
            email,
            password,
            nivel,
            experiencia,
            logros,
            ranking,
            amigos,
            solicitudes_pendientes
        } = req.body;
        
        // Crear un objeto con los campos a actualizar
        const updateData = {};
        if (nombre !== undefined) updateData.nombre = nombre;
        if (email !== undefined) {
            // Validar formato de email
            const emailRegex = /^\S+@\S+\.\S+$/;
            if (!emailRegex.test(email)) {
                return res.status(422).json({ error: "Formato de email inválido o la contraseña no cumple con los requisitos" });
            }
            updateData.email = email;
        }
        if (password !== undefined) {
            // Validar que la contraseña cumpla con los requisitos (por ejemplo, mínimo 8 caracteres)
            if (typeof password !== "string" || password.length < 8) {
                return res.status(422).json({ error: "Formato de email inválido o la contraseña no cumple con los requisitos" });
            }
            // Hashear la nueva contraseña
            updateData.password = await bcrypt.hash(password, 10);
        }
        if (nivel !== undefined) updateData.nivel = nivel;
        if (experiencia !== undefined) updateData.experiencia = experiencia;
        if (logros !== undefined) updateData.logros = logros;
        if (ranking !== undefined) updateData.ranking = ranking;
        if (amigos !== undefined) updateData.amigos = amigos;
        if (solicitudes_pendientes !== undefined) updateData.solicitudes_pendientes = solicitudes_pendientes;

        // Verificar que exista al menos un campo a actualizar
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: "No se proporcionaron datos para actualizar" });
        }

        // Verificar que el usuario exista
        const userRef = doc(db, "players", id);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        // Realizar la actualización
        await updateDoc(userRef, updateData);

        // Obtener la información actualizada del usuario
        const updatedUserSnap = await getDoc(userRef);
        const updatedUser = updatedUserSnap.data();
        delete updatedUser.password; // No enviar la contraseña

        return res.status(200).json({
            message: "Datos actualizados correctamente.",
             data: [updatedUser] });
    } catch (error) {
        console.error("Error actualizando usuario:", error);
        return res.status(400).json({ error: "No se pudo actualizar el usuario" });
    }
};


// 🔹 Actualizar usuario parcialmente (PATCH)
export const patchUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validar que se hayan enviado datos para actualizar
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ error: "No se proporcionaron datos para actualizar" });
        }
        
        const updates = req.body; // Campos a actualizar

        // Verificar que el usuario exista
        const userRef = doc(db, "players", id);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        
        // Intentar actualizar el documento con los datos enviados
        await updateDoc(userRef, updates);

        // Obtener la información actualizada del usuario
        const updatedUserSnap = await getDoc(userRef);
        const updatedUser = updatedUserSnap.data();

        return res.status(200).json({ 
            message: "Datos actualizados correctamente.",
            data: [updatedUser] });
    } catch (error) {
        console.error("Error actualizando usuario parcialmente:", error);
        return res.status(400).json({ error: "Solicitud inválida. Verifica los datos enviados" });
    }
};


// 🔹 Eliminar usuario (DELETE)
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validar que se proporcione el ID
        if (!id) {
            return res.status(400).json({ error: "El ID del usuario es requerido para eliminar la cuenta" });
        }
        
        // Referencia al usuario en la colección "players"
        const userRef = doc(db, "players", id);
        const userSnap = await getDoc(userRef);
        
        // Validar que el usuario exista
        if (!userSnap.exists()) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        
        // Eliminar el documento del usuario
        await deleteDoc(userRef);
        
        // Respuesta exitosa con la información eliminada
        return res.status(200).json({ data: [{ message: "Usuario eliminado correctamente" }] });
    } catch (error) {
        console.error("Error eliminando usuario:", error);
        return res.status(404).json({ error: "Error al eliminar el usuario. Inténtalo nuevamente" });
    }
};

// Obtener todos los usuarios (antes getAllPlayers en playerController)
export const getAllUsers = async (req, res) => {
    try {
      const querySnapshot = await getDocs(collection(db, "players")); // o "users" si renombras la colección
      const users = querySnapshot.docs.map(doc => {
        const data = doc.data();
        delete data.password; // por seguridad
        return {
          id: doc.id,
          ...data
        };
      });
      return res.status(200).json(users);
    } catch (error) {
      console.error("Error obteniendo usuarios:", error);
      return res.status(500).json({ error: "Error obteniendo usuarios" });
    }
  };
  

