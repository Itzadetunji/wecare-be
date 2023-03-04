import Joi from "joi";
import mongoose from "mongoose";

export const tokenSchema = new mongoose.Schema({
	token: {
		type: String,
		required: true,
	},
	companyId: mongoose.Schema.Types.ObjectId,
});

export const Token = mongoose.model("Token", tokenSchema);

export const validateToken = (payload) => {
	const schema = Joi.object({
		token: Joi.string().required(),
	});
	return schema.validate(payload);
};

export default Token;
