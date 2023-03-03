import passport from "passport";
import User, { validateUser } from "../models/user.model.js";
import EmailCode from "../models/emailCode.model.js";
import passportLocal from "passport-local";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { sendMail } from "../utils/nodemailertransport.js";

export const createNewUser = async (req, res) => {
	try {
		const { error } = validateUser(req.body);
		if (error)
			return res
				.status(StatusCodes.BAD_REQUEST)
				.json({ message: error.details[0].message });

		let user = await User.findOne({ email: req.body.email });
		if (user)
			return res.status(StatusCodes.BAD_REQUEST).json({
				message:
					"This email is already registered to an account, kindly Login.",
			});

		const salt = await bcrypt.genSalt(10);
		const password = await bcrypt.hash(req.body.password, salt);
		console.log(req.body.password, password);
		const { email } = req.body;
		user = new User({ email, password });
		await user.save();

		// Generate code to send to email
		const code = Math.floor(1000 + Math.random() * 9000).toString();
		await EmailCode.deleteMany({ userId: user._id });
		const emailCode = new EmailCode({ code, userId: user._id });
		const result = await emailCode.save();
		const link = `${process.env.HOST}/api/user/login/verify/${user._id}/${code}`;
		try {
			sendMail(
				user.email,
				(subject = "OTP To Login to your Konfampay User Account"),
				(message = `<p>Use this code to verify your email address:</p> <h1>${code}</h1><p>Or Login using this link: <br>${link}</p>`),
				(res) => {
					return (err, info) => {
						if (err) throw new Error("Email failed to send");
						res.status(StatusCodes.OK).json({
							status: "success",
							message: "Email has been sent",
						});
					};
				},
				res
			);
		} catch (err) {
			return res
				.status(StatusCodes.INTERNAL_SERVER_ERROR)
				.json({ status: "fail", message: "Email failed to send" });
		}
		return res.status(StatusCodes.CREATED).json({ code, user });
	} catch (error) {
		throw new Error("Failed to create the new user");
	}
};
