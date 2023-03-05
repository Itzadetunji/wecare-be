import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import Token from "../models/token.model.js";

export const auth = async (req, res, next) => {
	let token = req.cookies["api-auth"];
	if (token) {
		token = token.split(" ")[1];
	}
	// try {
		
	// } catch (error) {
	// 	if (error instanceof jwt.TokenExpiredError) {
	// 		return res.status(StatusCodes.FORBIDDEN).json({
	// 			status: "fail",
	// 			message: "Token has expired",
	// 		});
	// 	} else {
	// 		return res.status(StatusCodes.FORBIDDEN).json({
	// 			status: "fail",
	// 			message: "Invalid token",
	// 		});
	// 	}
	// }
	// const expirationTime = payload.exp;
	// const currentTime = Date.now() / 1000;
	// if (expirationTime < currentTime) {
	// 	return res.status(StatusCodes.FORBIDDEN).json({
	// 		status: "fail",
	// 		message: "Token has expired",
	// 	});
	// }
	try {
		const payload = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
		const storedToken = await Token.findOne({ jti: payload.jti });
		if (storedToken) {
			return res.status(StatusCodes.FORBIDDEN).json({
				status: "fail",
				message: "Invalid token",
			});
		}
		req.company = {
			id: payload.companyId,
			jti: payload.jti,
			name: payload.companyName,
			email: payload.email,
		};
		next();
	} catch (error) {
		if (error instanceof jwt.TokenExpiredError) {
			return res.status(StatusCodes.FORBIDDEN).json({
				status: "fail",
				message: "Token has expired",
			});
		} else {
			return res.status(StatusCodes.FORBIDDEN).json({
				status: "fail",
				message: "Invalid token",
			});
		}
	}
};

export default auth;
