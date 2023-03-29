import bcrypt from "bcrypt";
import Joi from "joi";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import Company from "../models/company.model.js";
import { StatusCodes } from "http-status-codes";
import { sendMail } from "../utils/nodemailertransport.js";
import Token from "../models/token.model.js";

export const forgotPassword = async (req, res) => {
	console.log(req.body);
	// Check if the email is a valid email address
	const { error } = validateEmail(req.body);
	if (error)
		return res
			.status(StatusCodes.BAD_REQUEST)
			.json({ status: "fail", message: error.details[0].message });

	// Check if the email exists in the database
	const company = await Company.findOne({ email: req.body.email });
	if (!company)
		return res.status(StatusCodes.NOT_FOUND).json({
			message:
				"This email is not registered with any account. If you do not have an account, you should create one.",
		});

	// Create a unique secret key for each user
	const secret = process.env.JWT_SECRET_KEY;
	const jti = uuidv4();
	const token = jwt.sign(
		{
			jti: jti,
			id: company._id,
		},
		process.env.JWT_PRIVATE_KEY,
		{
			expiresIn: "15m",
		}
	);

	const newToken = new Token({ jti: jti });
	console.log(token);
	newToken.save((err, savedToken) => {
		if (err) {
			res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
				status: "fail",
				message: "Something went wrong and could not add the jti",
			});
		}
	});
	// Generate the link
	const link = `${process.env.FRONTEND_BASE_URL}/reset?token=${token}`;
	sendMail(
		company.email,
		"OTP To Reset to your Wecare Company Account Password",
		`${link}`,
		(err, info) => {
			if (err) {
				console.error("Email failed to send:", err);
				return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
					status: "fail",
					message: "Email failed to send",
				});
			}
			return res.status(StatusCodes.CREATED).json({
				status: "success",
				message: "Email has been sent",
			});
		}
	);
};

export const resetPassword = async (req, res) => {
	const { newPassword, confirmPassword } = req.body;
	if (!newPassword || !confirmPassword) {
		return res
			.status(StatusCodes.PARTIAL_CONTENT)
			.json({ status: "fail", message: "New password required" });
	}

	const { error } = validatePassword(newPassword);
	if (error)
		return res
			.status(StatusCodes.BAD_REQUEST)
			.json({ status: "fail", message: error.details[0].message });
	if (!(newPassword === confirmPassword)) {
		return res.status(StatusCodes.PARTIAL_CONTENT).json({
			status: "fail",
			message: "The passwords supplied do not match",
		});
	}

	let company = await Company.findById(req.company.id);
	if (company) {
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(newPassword, salt);
		company.password = hashedPassword;
		company.save((err, savedData) => {
			if (err) {
				res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
					status: "fail",
					message:
						"Something went wrong and could not update the password",
				});
			} else {
				res.status(StatusCodes.OK).json({
					staus: "success",
					message: "Successfully updated the password",
				});
			}
		});
	} else {
		return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			status: "fail",
			message: "Something went wrong and could not update the password",
		});
	}
};

export const resetForgotPassword = async (req, res) => {
	const { newPassword, confirmNewPassword, token } = req.body;
	if (!token) {
		return res
			.status(StatusCodes.PARTIAL_CONTENT)
			.json({ status: "fail", message: "Token required" });
	}

	const decodedToken = jwt.decode(token, { complete: true });
	const expirationTime = decodedToken.payload.exp;
	const currentTime = Date.now() / 1000;

	if (currentTime > expirationTime) {
		return res
			.status(StatusCodes.FORBIDDEN)
			.json({ status: "fail", message: "Token has expired" });
	}

	const payload = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
	if (!newPassword || !confirmNewPassword) {
		return res
			.status(StatusCodes.PARTIAL_CONTENT)
			.json({ status: "fail", message: "New password required" });
	}

	try {
		const storedToken = await Token.findOne({ jti: payload.jti });
		if (!storedToken) {
			return res.status(StatusCodes.FORBIDDEN).json({
				status: "fail",
				message: "Invalid token",
			});
		}
	} catch (err) {
		return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			status: "fail",
			message: "Something went wrong",
		});
	}

	const { error } = validatePassword(newPassword);
	if (error)
		return res
			.status(StatusCodes.BAD_REQUEST)
			.json({ status: "fail", message: error.details[0].message });

	await Token.findOneAndDelete({ jti: payload.jti });

	if (!(newPassword === confirmNewPassword)) {
		return res.status(StatusCodes.PARTIAL_CONTENT).json({
			status: "fail",
			message: "The passwords supplied do not match",
		});
	}

	const salt = await bcrypt.genSalt(10);
	const password = await bcrypt.hash(newPassword, salt);

	try {
		const updatedCompany = await Company.findByIdAndUpdate(
			payload.id,
			{ password },
			{
				new: true,
			}
		);
		if (!updatedCompany) {
			return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
				status: "fail",
				message:
					"Something went wrong and could not update the password",
			});
		}
		res.status(StatusCodes.OK).json({
			staus: "success",
			message: "Successfully updated the password",
		});
	} catch (err) {
		console.error(err);
	}
};

const validateEmail = (company) => {
	const schema = Joi.object({
		email: Joi.string()
			.email({ minDomainSegments: 2, tlds: { allow: false } })
			.min(3)
			.max(100)
			.required()
			.label("Email"),
	});
	return schema.validate(company);
};

const validatePassword = (password) => {
	const schema = Joi.object({
		password: Joi.string().required().min(7).max(50),
	});
	return schema.validate({ password });
};
