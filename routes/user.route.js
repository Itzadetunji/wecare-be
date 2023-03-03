import express from "express";
import passport from "passport";
import { createNewUser } from "../controllers/user.controller.js";

const userRouter = express.Router();

userRouter.post("/", createNewUser);

export default userRouter;
