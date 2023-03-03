import passport from "passport";
import User, { validateUser } from "../models/user.js";
import passportLocal from "passport-local";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendMail } from "../utils/nodemailertransport.js";
import Joi from "joi";

export const createNewUser = (req, res) => {
	return res.status(200).json({ status: 200 });
};
