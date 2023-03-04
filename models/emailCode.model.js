import Joi from "joi";
import mongoose from "mongoose";

export const emailCodeSchema = new mongoose.Schema({
	code: {
		type: String,
		required: true,
		length: 4,
	},
	companyId: mongoose.Schema.Types.ObjectId,
});

export const EmailCode = mongoose.model("EmailCode", emailCodeSchema);

export const validateEmailCode = (payload) => {
	const schema = Joi.object({
		code: Joi.string()
			.length(4)
			.pattern(/^[0-9]+$/)
			.required(),
	});
	return schema.validate(payload);
};

export default EmailCode;
