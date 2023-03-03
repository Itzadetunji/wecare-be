import express from "express";
import passport from "passport";
import { createNewUser } from "../controllers/user.js";

const userRouter = express.Router();

userRouter.get("/", createNewUser);

export default userRouter;
