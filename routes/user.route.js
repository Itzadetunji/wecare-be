import express from "express";
import passport from "passport";
import {
	createNewUser,
	verifyUserEmail,
} from "../controllers/user.controller.js";

const userRouter = express.Router();

userRouter.post("/", createNewUser);
userRouter.post("/verify/:code/:id", verifyUserEmail);

export default userRouter;
