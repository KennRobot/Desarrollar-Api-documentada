import express from "express";
//import { getAllOrders, getOrderById, getOrderProducts, getOrderDiscounts, getOrderShippingStatus, createOrder, updateOrder, deleteOrder, updateOrderStatusByShipping,applyDiscountToOrder } from "../controllers/orderController.js";
import { getAllPlayers } from "../controllers/playerController.js";
const router = express.Router();

router.get("/", getAllPlayers);


export default router;
