import Joi from "joi";
import mongoose from "mongoose";

export const tokenSchema = new mongoose.Schema({
	jti: String,
	createdAt: { type: Date, default: Date.now },
});

export const Token = mongoose.model("Token", tokenSchema);

export const validateToken = (payload) => {
	const schema = Joi.object({
		token: Joi.string().required(),
	});
	return schema.validate(payload);
};

export default Token;
