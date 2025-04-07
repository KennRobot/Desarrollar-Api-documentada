import db from "../models/firebase.js";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, arrayUnion, arrayRemove} from "firebase/firestore";

// POST /usuarios/solicitud - Registrar una solicitud de amistad
// POST /usuarios/solicitud - Registrar una solicitud de amistad
// GET /usuarios/solicitud - Obtener todas las solicitudes de amistad
export const getAllFriendRequests = async (req, res) => {
    try {
      const solicitudesRef = collection(db, "solicitudes");
      const snapshot = await getDocs(solicitudesRef);
  
      if (snapshot.empty) {
        return res.status(404).json({ error: "No se encontraron solicitudes de amistad" });
      }
  
      // Mapear cada documento para incluir su ID y datos
      const friendRequests = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
  
      return res.status(200).json({ friendRequests });
      
    } catch (error) {
      console.error("Error al obtener las solicitudes de amistad:", error);
      return res.status(500).json({ error: "No se pudieron obtener las solicitudes de amistad" });
    }
  };

  export const createFriendRequest = async (req, res) => {
    try {
      const { de_usuario_id, para_usuario_id } = req.body;
  
      // Validar que el cuerpo de la solicitud sea un objeto JSON válido con los campos requeridos
      if (!req.body || !de_usuario_id || !para_usuario_id) {
        return res.status(400).json({ error: "El cuerpo de la solicitud debe ser un objeto JSON válido" });
      }
  
      // Validar que no se envíe una solicitud a uno mismo
      if (de_usuario_id === para_usuario_id) {
        return res.status(400).json({ error: "No se puede enviar una solicitud a uno mismo" });
      }
  
      // Verificar que el usuario autenticado sea el emisor de la solicitud
      // Se asume que req.user es establecido por un middleware de autenticación JWT
      if (!req.user || req.user.id !== de_usuario_id) {
        return res.status(403).json({ error: "No tienes permiso para enviar esta solicitud" });
      }
  
      // Verificar que ambos usuarios existan en la colección "players"
      const senderRef = doc(db, "players", de_usuario_id);
      const receiverRef = doc(db, "players", para_usuario_id);
      const senderSnap = await getDoc(senderRef);
      const receiverSnap = await getDoc(receiverRef);
      if (!senderSnap.exists() || !receiverSnap.exists()) {
        return res.status(404).json({ error: "Usuario emisor o receptor no encontrado" });
      }
  
      // Verificar que los usuarios no sean ya amigos
      const senderData = senderSnap.data();
      if (senderData.amigos && senderData.amigos.includes(para_usuario_id)) {
        return res.status(400).json({ error: "Los usuarios ya son amigos" });
      }
  
      // Verificar que no exista ya una solicitud pendiente entre estos usuarios
      const solicitudesRef = collection(db, "solicitudes");
      const pendingQuery = query(
        solicitudesRef,
        where("de_usuario_id", "==", de_usuario_id),
        where("para_usuario_id", "==", para_usuario_id),
        where("estado", "==", "pendiente")
      );
      const pendingSnapshot = await getDocs(pendingQuery);
      if (!pendingSnapshot.empty) {
        return res.status(400).json({ error: "Ya existe una solicitud pendiente entre estos usuarios" });
      }
  
      // Crear la solicitud de amistad con estado "pendiente" y la fecha actual
      const newSolicitud = {
        de_usuario_id,
        para_usuario_id,
        fecha: new Date().toISOString(),
        estado: "pendiente"
      };
      const solicitudRef = doc(solicitudesRef); // Se genera un ID automáticamente
      await setDoc(solicitudRef, newSolicitud);
  
      // Actualizar el campo "solicitudes_pendientes" del usuario receptor
      // Se agrega un objeto con el id de la solicitud y el nombre del usuario emisor
      await updateDoc(receiverRef, {
        solicitudes_pendientes: arrayUnion({
          id: solicitudRef.id,
          nombre: senderData.nombre
        })
      });
  
      // Respuesta exitosa
      return res.status(200).json({
        data: { id: solicitudRef.id, ...newSolicitud }
      });
      
    } catch (error) {
      console.error("Error creando solicitud de amistad:", error);
      return res.status(400).json({ error: "No se pudo enviar la solicitud de amistad" });
    }
  };
  
  


// GET /usuarios/solicitud/:id - Obtener datos de una solicitud de amistad (detalle)
export const getFriendRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        // Validar que se proporcione el ID de la solicitud
        if (!id) {
            return res.status(400).json({ error: "El ID de la solicitud es requerido" });
        }

        const solicitudRef = doc(db, "solicitudes", id);
        const solicitudSnap = await getDoc(solicitudRef);

        // Validar que la solicitud exista
        if (!solicitudSnap.exists()) {
            return res.status(404).json({ error: "Solicitud no encontrada" });
        }

        const solicitud = solicitudSnap.data();

        return res.status(200).json({ data: solicitud });
    } catch (error) {
        console.error("Error obteniendo la solicitud:", error);
        return res.status(400).json({ error: "Error al obtener la solicitud" });
    }
};


// GET /usuarios/solicitud/:id - Obtener lista de solicitudes de un usuario
// (Podemos utilizar un query string o un endpoint separado; aquí se ilustra asumiendo que :id es el id del usuario receptor)
export const getFriendRequestByUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validar que se proporcione el ID del usuario
        if (!id) {
            return res.status(400).json({ error: "El ID del usuario es requerido" });
        }
        
        // Consultar las solicitudes para el usuario
        const solicitudesRef = collection(db, "solicitudes");
        const q = query(solicitudesRef, where("para_usuario_id", "==", id));
        const querySnapshot = await getDocs(q);
        const solicitudes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Validar que se hayan encontrado solicitudes
        if (solicitudes.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        
        return res.status(200).json({ data: solicitudes });
    } catch (error) {
        console.error("Error al obtener las solicitudes:", error);
        return res.status(400).json({ error: "Error al obtener las solicitudes" });
    }
};

// PATCH /usuarios/solicitud/:id - Actualizar el estado de una solicitud
export const updateFriendRequest = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Validar que el cuerpo de la solicitud sea un objeto JSON válido
      if (!req.body || typeof req.body !== "object") {
        return res.status(400).json({ error: "El cuerpo de la solicitud debe ser un objeto JSON válido" });
      }
  
      const { estado } = req.body;
  
      // Validar que el estado sea "aceptada" o "rechazada"
      if (estado !== "aceptada" && estado !== "rechazada") {
        return res.status(400).json({ error: "Estado inválido. Debe ser 'aceptada' o 'rechazada'" });
      }
  
      const solicitudRef = doc(db, "solicitudes", id);
      const solicitudSnap = await getDoc(solicitudRef);
  
      // Validar que la solicitud exista
      if (!solicitudSnap.exists()) {
        return res.status(404).json({ error: "Solicitud no encontrada" });
      }
  
      const solicitud = solicitudSnap.data();
  
      // Verificar que la solicitud aún esté pendiente
      if (solicitud.estado !== "pendiente") {
        return res.status(400).json({ error: "La solicitud ya no está pendiente" });
      }
  
      // Obtener datos del usuario emisor y receptor
      const senderRef = doc(db, "players", solicitud.de_usuario_id);
      const senderSnap = await getDoc(senderRef);
      if (!senderSnap.exists()) {
        return res.status(404).json({ error: "Usuario emisor no encontrado" });
      }
      const senderData = senderSnap.data();
  
      const receiverRef = doc(db, "players", solicitud.para_usuario_id);
      const receiverSnap = await getDoc(receiverRef);
      if (!receiverSnap.exists()) {
        return res.status(404).json({ error: "Usuario receptor no encontrado" });
      }
      const receiverData = receiverSnap.data();
  
      // Si se acepta la solicitud
      if (estado === "aceptada") {
        // Actualizar el estado de la solicitud a "aceptada"
        await updateDoc(solicitudRef, { estado });
  
        // Remover la solicitud pendiente del usuario receptor
        await updateDoc(receiverRef, {
          solicitudes_pendientes: arrayRemove({ id, nombre: senderData.nombre })
        });
  
        // Agregar cada usuario a la lista de amigos del otro
        await updateDoc(receiverRef, {
          amigos: arrayUnion({ id: senderRef.id, nombre: senderData.nombre })
        });
        await updateDoc(senderRef, {
          amigos: arrayUnion({ id: receiverRef.id, nombre: receiverData.nombre })
        });
  
        return res.status(200).json({
          data: { ...solicitud, estado: "aceptada" },
          message: "Solicitud aceptada y los usuarios se han agregado como amigos"
        });
      }
  
      // Si se rechaza la solicitud
      if (estado === "rechazada") {
        // Remover la solicitud pendiente del usuario receptor
        await updateDoc(receiverRef, {
          solicitudes_pendientes: arrayRemove({ id, nombre: senderData.nombre })
        });
        // Eliminar la solicitud de la colección
        await deleteDoc(solicitudRef);
  
        return res.status(200).json({
          data: { id },
          message: "Solicitud rechazada y eliminada"
        });
      }
    } catch (error) {
      console.error("Error actualizando solicitud:", error);
      return res.status(400).json({ error: "No se pudo actualizar la solicitud" });
    }
  };

// DELETE /usuarios/solicitud/:id - Eliminar solicitud de amistad
export const deleteFriendRequest = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Validar que se proporcione el ID de la solicitud
      if (!id) {
        return res.status(400).json({ error: "El ID de la solicitud es requerido" });
      }
  
      const solicitudRef = doc(db, "solicitudes", id);
      const solicitudSnap = await getDoc(solicitudRef);
  
      // Verificar que la solicitud exista
      if (!solicitudSnap.exists()) {
        return res.status(404).json({ error: "Solicitud no encontrada" });
      }
  
      const solicitud = solicitudSnap.data();
  
      // Verificar que el usuario autenticado sea el emisor o receptor de la solicitud
      if (
        !req.user ||
        (req.user.id !== solicitud.de_usuario_id && req.user.id !== solicitud.para_usuario_id)
      ) {
        return res.status(403).json({ error: "Solo el emisor o receptor pueden eliminar la solicitud" });
      }
  
      if (solicitud.estado === "aceptada") {
        // La solicitud fue aceptada: eliminar de la lista de amigos de ambos usuarios
  
        // Referencias a los documentos del emisor y receptor
        const senderRef = doc(db, "players", solicitud.de_usuario_id);
        const receiverRef = doc(db, "players", solicitud.para_usuario_id);
  
        // Obtener datos de ambos usuarios
        const senderSnap = await getDoc(senderRef);
        if (!senderSnap.exists()) {
          return res.status(404).json({ error: "Usuario emisor no encontrado" });
        }
        const senderData = senderSnap.data();
  
        const receiverSnap = await getDoc(receiverRef);
        if (!receiverSnap.exists()) {
          return res.status(404).json({ error: "Usuario receptor no encontrado" });
        }
        const receiverData = receiverSnap.data();
  
        // Remover cada uno de la lista de amigos del otro usuario
        await updateDoc(senderRef, {
          amigos: arrayRemove({ id: solicitud.para_usuario_id, nombre: receiverData.nombre })
        });
        await updateDoc(receiverRef, {
          amigos: arrayRemove({ id: solicitud.de_usuario_id, nombre: senderData.nombre })
        });
  
        // Eliminar la solicitud de la colección "solicitudes"
        await deleteDoc(solicitudRef);
      } else {
        // La solicitud no está aceptada: eliminar de las solicitudes pendientes del receptor
  
        // Obtener datos del usuario emisor (para obtener el nombre)
        const senderRef = doc(db, "players", solicitud.de_usuario_id);
        const senderSnap = await getDoc(senderRef);
        if (!senderSnap.exists()) {
          return res.status(404).json({ error: "Usuario emisor no encontrado" });
        }
        const senderData = senderSnap.data();
  
        // Referencia al documento del usuario receptor
        const receiverRef = doc(db, "players", solicitud.para_usuario_id);
  
        // Actualizar el campo "solicitudes_pendientes" del receptor removiendo la solicitud
        await updateDoc(receiverRef, {
          solicitudes_pendientes: arrayRemove({ id, nombre: senderData.nombre })
        });
  
        // Eliminar la solicitud de la colección "solicitudes"
        await deleteDoc(solicitudRef);
      }
  
      return res.status(200).json({
        data: { id },
        message: "Solicitud eliminada correctamente"
      });
    } catch (error) {
      console.error("Error eliminando solicitud:", error);
      return res.status(400).json({ error: "No se pudo eliminar la solicitud" });
    }
  };
  
  

