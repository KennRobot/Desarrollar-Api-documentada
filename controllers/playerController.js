import db from "../models/firebase.js";
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";

// Obtener todas las órdenes desde Firestore
export const getAllPlayers = async (req, res) => {
    try {
        const querySnapshot = await getDocs(collection(db, "players"));
        const players = querySnapshot.docs.map(doc => ({
            id: doc.id,  // Firebase genera el ID automáticamente
            nombre: doc.data().nombre,
            email: doc.data().email,
            password: doc.data().password,  // Considera no enviar esto por seguridad
            nivel: doc.data().nivel,
            experiencia: doc.data().experiencia,
            logros: doc.data().logros || [],
            ranking: doc.data().ranking,
            amigos: doc.data().amigos || [],
            solicitudes_pendientes: doc.data().solicitudes_pendientes || []
        }));

        res.status(200).json(players);
    } catch (error) {
        console.error("Error obteniendo jugadores:", error);
        res.status(500).json({ error: "Error obteniendo jugadores" });
    }
};

