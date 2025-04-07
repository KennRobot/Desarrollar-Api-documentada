import express from "express";
//import { getAllOrders, getOrderById, getOrderProducts, getOrderDiscounts, getOrderShippingStatus, createOrder, updateOrder, deleteOrder, updateOrderStatusByShipping,applyDiscountToOrder } from "../controllers/orderController.js";
import { getAllPlayers } from "../controllers/playerController.js";
import { registerUser, loginUser, getUserById, updateUser, patchUser, deleteUser } from "../controllers/usersControllers.js";
const router = express.Router();

// Rutas de la API para usuarios
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.patch("/:id", patchUser);
router.delete("/:id", deleteUser);


router.get("/", getAllPlayers);


export default router;
