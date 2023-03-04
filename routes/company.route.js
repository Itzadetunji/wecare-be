import express from "express";
import passport from "passport";
import {
	authenticateCompany,
	createNewCompany,
	logoutCompany,
	verifyCompanyEmail,
} from "../controllers/company.controller.js";

const companyRouter = express.Router();

companyRouter.post("/auth", authenticateCompany);
companyRouter.post("/logout", logoutCompany);
companyRouter.post("/", createNewCompany);
companyRouter.post("/verify/:id/:code", verifyCompanyEmail);

export default companyRouter;
