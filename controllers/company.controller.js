import passport from "passport";
import Company, {
	validateCompany,
	validateCreateCompany,
} from "../models/company.model.js";
import EmailCode, { validateEmailCode } from "../models/emailCode.model.js";
import Token from "../models/token.model.js";
import passportLocal from "passport-local";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import { sendMail } from "../utils/nodemailertransport.js";
import { isValidObjectId } from "mongoose";
import dayjs from "dayjs";

export const authenticateCompany = async (req, res) => {
	const { error } = validateCompany(req.body);
	if (error)
		return res
			.status(StatusCodes.BAD_REQUEST)
			.json({ status: "fail", message: error.details[0].message });

	let company = await Company.findOne({ email: req.body.email });
	if (!company)
		return res.status(StatusCodes.NOT_FOUND).json({
			status: "fail",
			message:
				"This email is not registered with any account. Please check the email and try again",
		});

	const validPassword = await bcrypt.compare(
		req.body.password,
		company.password
	);
	if (!validPassword)
		return res.status(StatusCodes.BAD_REQUEST).json({
			status: "fail",
			message:
				"This password does not match the password associated with this account. Kindly check the password and try again",
		});

	const token = "Bearer " + company.generateAuthToken();
	const storeToken = new Token({
		token: token.split(" ")[1],
		companyId: company._id,
	});
	await storeToken.save();

	if (!isCompanyVerifiedFunc(req, res, company)) {
		res.cookie("api-auth", token, {
			secure: false,
			httpOnly: true,
			expires: dayjs().add(7, "days").toDate(),
		});
		return res.status(StatusCodes.OK).json({ status: "success", token });
	}
};

export const logoutCompany = async (req, res) => {
	let token = req.cookies["api-auth"];
	if (token) {
		// await Token.deleteMany({ companyId });
		token = token.split(" ")[1];
		res.cookie("api-auth", token, { maxAge: 0 });
	}
	return res
		.status(StatusCodes.OK)
		.json({ status: "success", message: "Logout successful" });
};

export const createNewCompany = async (req, res) => {
	try {
		const { error } = validateCreateCompany(req.body);
		if (error) {
			return res
				.status(StatusCodes.BAD_REQUEST)
				.json({ message: error.details[0].message });
		}

		const existingCompany = await Company.findOne({
			email: req.body.email,
		});
		if (existingCompany) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				message:
					"This email is already registered to an account, kindly Login.",
			});
		}

		const salt = await bcrypt.genSalt(10);
		const password = await bcrypt.hash(req.body.password, salt);
		const { companyAddress, companyName, email, mobileNumber } = req.body;
		const company = new Company({
			companyAddress,
			companyName,
			email,
			mobileNumber,
			password,
		});
		await company.save();

		const code = Math.floor(1000 + Math.random() * 9000).toString();
		await EmailCode.deleteMany({ companyId: company._id });
		const emailCode = new EmailCode({ code, companyId: company._id });
		await emailCode.save();
		const link = `${process.env.HOST}/api/company/verify/${company._id}/${code}`;

		sendMail(
			company.email,
			"OTP To Verify to your Wecare Company Account",
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
		console.error("Failed to create the new company:", error);
		return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			status: "fail",
			message: "Failed to create the new company",
		});
	}
};

export const verifyCompanyEmail = async (req, res) => {
	const { code, id } = req.params;
	if (!isValidObjectId(id))
		return res
			.status(StatusCodes.BAD_REQUEST)
			.json({ status: "fail", message: "This Id is not valid!" });

	const company = await Company.findById(id);
	if (!company)
		return res
			.status(StatusCodes.NOT_FOUND)
			.json({ status: "fail", message: "This company does not exist!" });

	if (company.emailVerified)
		return res.status(StatusCodes.BAD_REQUEST).json({
			status: "fail",
			message: "This email has already been verified",
		});

	let emailCode = await EmailCode.findOne({ companyId: id, code });
	console.log(code);
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

	company.emailVerified = true;
	company.accountVerified = true;
	await company.save();

	await EmailCode.deleteMany({ companyId: id });

	return res
		.status(StatusCodes.OK)
		.json({ status: "success", message: "Email verified successfully!" });
};



const isCompanyVerifiedFunc = (req, res, company) => {
	if (!company.accountVerified || !company.emailVerified) {
		!company.accountVerified &&
			(message =
				"This company's account has not been verified. Kindly verify!");
		!company.emailVerified &&
			(message =
				"This company's email has not been verified. Kindly verify! ");
		!company.accountVerified === !company.emailVerified &&
			(message =
				"This company's account and email has not been verified. Kindly verify!");
		return res.status(StatusCodes.OK).json({
			status: "fail",
			companyId: company._id,
			emailVerified: company.emailVerified,
			accountVerified: company.accountVerified,
			message,
		});
	}
};
