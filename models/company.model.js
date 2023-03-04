import mongoose from "mongoose";
import Joi from "joi";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const companySchema = mongoose.Schema(
	{
		accountVerified: {
			type: Boolean,
			default: false,
		},
		companyAddress: {
			type: String,
			minLength: 3,
			maxLength: 30,
		},
		companyName: {
			type: String,
			minLength: 3,
			maxLength: 30,
		},
		email: {
			type: String,
			minLength: 3,
			maxLength: 50,
			match: [
				/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
				"Please endter a valid email address",
			],
			required: true,
			unique: true,
		},
		emailVerified: {
			type: Boolean,
			default: false,
		},
		mobileNumber: {
			type: String,
			required: true,
			match: [
				/^(?:(?:\+|00)234)?(?:0)?[789]0\d{8}$/,
				"Please enter a phone number",
			],
			unique: true,
		},
		password: {
			type: String,
			minLength: 8,
			required: true,
		},
	},
	{ timestamps: true }
);

companySchema.methods.isValidPassword = async (
	password_supplied,
	company_password
) => {
	const isValid = await bcrypt.compare(password_supplied, company_password);
	return isValid;
};

companySchema.methods.generateAuthToken = function () {
	const token = jwt.sign(
		{
			companyId: this._id,
			companyName: this.companyName,
			email: this.email,
		},
		process.env.JWT_PRIVATE_KEY,
		{
			expiresIn: "1d",
		}
	);
	return token;
};

const Company = mongoose.model("Company", companySchema);

export const validateCompany = (payload) => {
	const schema = Joi.object({
		email: Joi.string()
			.email({ minDomainSegments: 2, tlds: { allow: false } })
			.required()
			.min(3)
			.max(50),
		password: Joi.string().min(8).max(50).required(),
	});

	return schema.validate(payload);
};

export const validateCreateCompany = (payload) => {
	const schema = Joi.object({
		companyAddress: Joi.string().min(8).max(50).required(),
		companyName: Joi.string().min(8).max(50).required(),
		email: Joi.string()
			.email({ minDomainSegments: 2, tlds: { allow: false } })
			.required()
			.min(3)
			.max(50),
		mobileNumber: Joi.string().min(8).max(50).required(),
		password: Joi.string().min(8).max(50).required(),
	});

	return schema.validate(payload);
};

export default Company;
