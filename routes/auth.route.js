import express from "express";
import passport from "passport";
import {
	authenticateCompany,
	logoutCompany,
} from "../controllers/auth.controller.js";

const authRouter = express.Router();

authRouter.post("/", authenticateCompany);
authRouter.get("/logout", logoutCompany);

export default authRouter;
