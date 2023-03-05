import express from "express";
import passport from "passport";
import {
	createNewCompany,
	verifyCompanyEmail,
} from "../controllers/company.controller.js";

const companyRouter = express.Router();

companyRouter.post("/", createNewCompany);
companyRouter.post("/verify/:id/:code", verifyCompanyEmail);

export default companyRouter;
