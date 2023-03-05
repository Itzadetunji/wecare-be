import bcrypt from "bcrypt";
import { StatusCodes } from "http-status-codes";
import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";
import Company, { validateCompany } from "../models/company.model.js";
import Token from "../models/token.model.js";

const jti = uuidv4();

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
		token = token.split(" ")[1];
		const storeToken = new Token({
			jti,
		});
		await storeToken.save();

		res.cookie("api-auth", token, { maxAge: 0 });
	}
	return res
		.status(StatusCodes.OK)
		.json({ status: "success", message: "Logout successful" });
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
