import express from "express";
import passport from "passport";
import {
	forgotPassword,
  resetForgotPassword,
	resetPassword,
} from "../controllers/forgotPassword.controller.js";
import auth from "../middleware/auth.js";

const forgotPasswordRouter = express.Router();

forgotPasswordRouter.post("/", forgotPassword);
forgotPasswordRouter.post("/reset/", auth, resetPassword);
forgotPasswordRouter.post("/reset/forgot/:token" , resetForgotPassword);

export default forgotPasswordRouter;
