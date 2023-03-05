import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
// const { cookieExtractor } = require("./admin");

export const auth = async (req, res, next) => {
	let token = req.cookies["api-auth"];
	if (token) {
		token = token.split(" ")[1];
	}
	try {
		const payload = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
		req.company = {
			id: payload.companyId,
			name: payload.companyName,
			email: payload.email,
		};
		next();
	} catch (error) {
		return res.status(StatusCodes.FORBIDDEN).json({
			status: "fail",
			message: "Please login to access this route",
		});
		// throw new Error("Could not authenticate user");
	}
};

export default auth;
