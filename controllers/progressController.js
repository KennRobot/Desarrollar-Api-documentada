import db from "../models/firebase.js";
import { doc, getDoc, getDocs, updateDoc, query, orderBy, arrayUnion, collection, writeBatch } from "firebase/firestore";

// GET /usuarios/:id/progreso - Obtener el progreso del jugador
export const getProgress = async (req, res) => {
    try {
        const { id } = req.params;
        const userRef = doc(db, "players", id);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return res.status(404).json({
                error: "Usuario no encontrado"
            });
        }

        const { nombre, nivel, experiencia } = userSnap.data();
        const siguiente_nivel = (nivel + 1) * 1000; // Ejemplo de cálculo

        res.status(200).json({
            data: { id, nombre, nivel, experiencia, siguiente_nivel },
            message: "Progreso obtenido correctamente"
        });
    } catch (error) {
        console.error("Error obteniendo progreso:", error);
        res.status(422).json({
            error: "Error al obtener el progreso del usuario"
        });
    }
};

// PUT /usuarios/:id/progreso - Actualizar experiencia (sumar a la actual)
export const updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { experiencia: expToAdd } = req.body;

    // 1) Validación de la experiencia entrante
    if (expToAdd === undefined) {
      return res.status(400).json({
        error: "No se proporcionó experiencia para actualizar"
      });
    }
    if (!Number.isInteger(expToAdd) || expToAdd < 0) {
      return res.status(422).json({
        error: "La experiencia debe ser un número entero positivo"
      });
    }

    // 2) Lectura del jugador en Firestore
    const userRef = doc(db, "players", id);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return res.status(404).json({
        error: "El jugador no fue encontrado"
      });
    }

    // 3) Obtenemos nivel y experiencia actuales
    const { nivel, experiencia: currentExp } = userSnap.data();

    // 4) Sumamos la experiencia nueva
    const nuevaExp = currentExp + expToAdd;

    // 5) Actualizamos sólo la experiencia en Firestore
    await updateDoc(userRef, { experiencia: nuevaExp });

    // 6) Calculamos el umbral para el siguiente nivel
    const siguiente_nivel = (nivel + 1) * 1000;

    // 7) Construimos el mensaje
    const baseMsg = "Experiencia actualizada correctamente";
    const extraMsg = nuevaExp >= siguiente_nivel
      ? " YA PUEDES SUBIR DE NIVEL"
      : "";
    const message = baseMsg + extraMsg;

    // 8) Respondemos
    res.status(200).json({
      data: { id, nivel, experiencia: nuevaExp, siguiente_nivel },
      message
    });

  } catch (error) {
    console.error("Error actualizando progreso:", error);
    res.status(500).json({
      error: "No se pudo actualizar el progreso del usuario"
    });
  }
};


// POST /usuarios/:id/subirNivel - Subir el nivel del jugador
  
  export const subirNivel = async (req, res) => {
    try {
      const { id } = req.params;
      const userRef = doc(db, "players", id);
      const userSnap = await getDoc(userRef);
  
      if (!userSnap.exists()) {
        return res.status(404).json({ error: "El jugador no fue encontrado" });
      }
  
      // 1) Nivel y experiencia actuales
      let { nivel, experiencia } = userSnap.data();
  
      // 2) Verificamos si puede subir al menos un nivel
      if (experiencia < (nivel + 1) * 1000) {
        return res.status(422).json({
          error: "El jugador no tiene la experiencia necesaria para subir de nivel"
        });
      }
  
      // 3) Iteramos subiendo niveles mientras haya experiencia
      const mensajes = [];
      while (experiencia >= (nivel + 1) * 1000) {
        const requiredExp = (nivel + 1) * 1000;
        experiencia -= requiredExp;
        nivel++;
        mensajes.push("Haz subido de nivel!");
      }
  
      // 4) Guardamos nivel y experiencia actualizados
      await updateDoc(userRef, { nivel, experiencia });
  
      // 5) Recalculamos ranking global:
      //    - Traemos todos los jugadores
      const allSnap = await getDocs(collection(db, "players"));
      //    - Creamos array con {id, nivel}
      const arr = allSnap.docs.map(d => ({
        id: d.id,
        nivel: d.data().nivel
      }));
      //    - Ordenamos desc por nivel
      arr.sort((a, b) => b.nivel - a.nivel);
      //    - Batch update de ranking
      const batch = writeBatch(db);
      arr.forEach((p, idx) => {
        const ref = doc(db, "players", p.id);
        batch.update(ref, { ranking: idx + 1 });
      });
      await batch.commit();  // :contentReference[oaicite:0]{index=0}
  
      // 6) Preparamos respuesta
      const siguiente_nivel = (nivel + 1) * 1000;
      const message = mensajes.join(" ");
  
      return res.status(200).json({
        data: { id, nivel, experiencia, siguiente_nivel },
        message
      });
  
    } catch (error) {
      console.error("Error subiendo de nivel:", error);
      return res.status(500).json({
        error: "No se pudo subir de nivel al jugador"
      });
    }
  };
  

// GET /usuarios/ranking - Obtener ranking global
export const getGlobalRanking = async (req, res) => {
  try {
    // 1) Traemos todos los jugadores
    const querySnapshot = await getDocs(collection(db, "players"));
    const players = querySnapshot.docs.map(doc => ({
      id: doc.id,
      nombre: doc.data().nombre,
      nivel: doc.data().nivel,
      experiencia: doc.data().experiencia,
      // Otros campos si los necesitas...
    }));

    // 2) Ordenamos por nivel descendente
    players.sort((a, b) => b.nivel - a.nivel);

    // 3) Asignamos ranking según posición
    const ranked = players.map((p, idx) => ({
      ...p,
      ranking: idx + 1
    }));

    // 4) Devolvemos el ranking
    return res.status(200).json(ranked);
  } catch (error) {
    console.error("Error obteniendo ranking global:", error);
    return res.status(500).json({
      error: "No se pudo obtener el ranking global"
    });
  }
};

//AGREGAR LOGROS A UN JUGADOR POST
export const addLogros = async (req, res) => {
    try {
      const { id } = req.params;
      const nuevosLogros = req.body;
  
      // 1) Validación básica del body: debe ser un array no vacío
      if (!Array.isArray(nuevosLogros) || nuevosLogros.length === 0) {
        return res.status(400).json({
          error: "Debes enviar un array de logros en el body"
        });
      }
  
      // 2) Validar estructura de cada logro (solo debe contener nombre y descripción)
      for (const logro of nuevosLogros) {
        if (
          typeof logro.nombre !== "string" ||
          typeof logro.descripcion !== "string"
        ) {
          return res.status(422).json({
            error: "Cada logro debe tener { nombre: string, descripcion: string }"
          });
        }
      }
  
      // 3) Comprobar que el jugador existe
      const userRef = doc(db, "players", id);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        return res.status(404).json({
          error: "Jugador no encontrado"
        });
      }
  
      // 4) Preparar la actualización
      // Se obtiene el array actual de logros, o se inicializa en [] si no existe
      const playerData = userSnap.data();
      const logrosActuales = playerData.logros || [];
  
      // Determinar el siguiente id: se toma el máximo existente y se suma 1, o se inicia en 1
      let nextId = logrosActuales.length > 0 
        ? Math.max(...logrosActuales.map(l => l.id)) + 1 
        : 1;
  
      // Filtrar y preparar los logros nuevos (evitar duplicados, por ejemplo, si ya existe un logro con el mismo nombre)
      const logrosAAgregar = [];
      for (const logro of nuevosLogros) {
        const existe = logrosActuales.some(l => l.nombre === logro.nombre);
        if (!existe) {
          logrosAAgregar.push({
            id: nextId,
            nombre: logro.nombre,
            descripcion: logro.descripcion
          });
          nextId++;
        }
      }
  
      // Si no hay logros nuevos para agregar, se informa y se retorna
      if (logrosAAgregar.length === 0) {
        return res.status(200).json({
          message: "No se agregaron logros ya que ya existen."
        });
      }
  
      // 5) Agregar los logros atómicamente
      await updateDoc(userRef, {
        logros: arrayUnion(...logrosAAgregar)
      });
  
      // 6) Respuesta
      return res.status(200).json({
        message: "Logros agregados correctamente",
        logros: logrosAAgregar
      });
  
    } catch (error) {
      console.error("Error agregando logros:", error);
      return res.status(422).json({
        error: "No se pudo agregar los logros al jugador"
      });
    }
  };
  