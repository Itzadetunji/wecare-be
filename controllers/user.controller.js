import passport from "passport";
import User, { validateUser } from "../models/user.model.js";
import EmailCode, { validateEmailCode } from "../models/emailCode.model.js";
import passportLocal from "passport-local";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { sendMail } from "../utils/nodemailertransport.js";
import { isValidObjectId } from "mongoose";

export const createNewUser = async (req, res) => {
	try {
		const { error } = validateUser(req.body);
		if (error) {
			return res
				.status(StatusCodes.BAD_REQUEST)
				.json({ message: error.details[0].message });
		}

		const existingUser = await User.findOne({ email: req.body.email });
		if (existingUser) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				message:
					"This email is already registered to an account, kindly Login.",
			});
		}

		const salt = await bcrypt.genSalt(10);
		const password = await bcrypt.hash(req.body.password, salt);
		const { email } = req.body;
		const user = new User({ email, password });
		await user.save();

		const code = Math.floor(1000 + Math.random() * 9000).toString();
		await EmailCode.deleteMany({ userId: user._id });
		const emailCode = new EmailCode({ code, userId: user._id });
		await emailCode.save();
		const link = `${process.env.HOST}/api/user/login/verify/${user._id}/${code}`;

		sendMail(
			user.email,
			"OTP To Login to your Wecare User Account",
			`<p>Use this code to verify your email address:</p> <h1>${code}</h1><p>Or Login using this link: <br>${link}</p>`,
			(err, info) => {
				if (err) {
					console.error("Email failed to send:", err);
					return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
						status: "fail",
						message: "Email failed to send",
					});
				}
				console.log(code);
				return res.status(StatusCodes.CREATED).json({
					status: "success",
					message: "Email has been sent",
				});
			}
		);
	} catch (error) {
		console.error("Failed to create the new user:", error);
		return res
			.status(StatusCodes.INTERNAL_SERVER_ERROR)
			.json({ status: "fail", message: "Failed to create the new user" });
	}
};

export const verifyUserEmail = async (req, res) => {
	const { code, id } = req.params;
	if (!isValidObjectId(id))
		return res
			.status(StatusCodes.BAD_REQUEST)
			.json({ status: "fail", message: "This Id is not valid!" });

	const user = await User.findById(id);
	if (!user)
		return res
			.status(StatusCodes.NOT_FOUND)
			.json({ status: "fail", message: "This user does not exist!" });

	if (user.emailVerified)
		return res.status(StatusCodes.BAD_REQUEST).json({
			status: "fail",
			message: "This email has already been verified",
		});

	let emailCode = await EmailCode.findOne({ userId: id, code });

	if (!emailCode || emailCode.code !== code)
		return res.status(StatusCodes.BAD_REQUEST).json({
			status: "fail",
			message: "Please request for another code!",
		});

	const { error } = validateEmailCode({ code });

	if (error)
		return res
			.status(StatusCodes.BAD_REQUEST)
			.json({ message: error.details[0].message });

	user.emailVerified = true;
	await user.save();

	await EmailCode.deleteMany({ userId: id });

	return res
		.status(StatusCodes.OK)
		.json({ status: "success", message: "Email verified successfully!" });
};
