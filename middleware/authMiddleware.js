import jwt from 'jsonwebtoken';

const SECRET_KEY = 'team2';

export const authenticateToken = (req, res, next) => {
    // Obtener el token del encabezado Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(403).json({ message: "No autorizado" });
    }

    // El token usualmente viene con el prefijo 'Bearer '
    const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7).trim() 
        : authHeader;

    try {
        // Verificar el token
        const verified = jwt.verify(token, SECRET_KEY);
        // Asignar la información decodificada al request para futuros usos
        req.user = verified;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Token inválido" });
    }
};
