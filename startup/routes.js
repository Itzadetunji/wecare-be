import error from "../middleware/Error.js";
import companyRouter from "../routes/company.route.js";
import forgotPasswordRouter from "../routes/forgotPassword.route.js";

export default (app) => {
	app.use("/api/company", companyRouter);
	app.use("/api/forgot", forgotPasswordRouter);
	app.get("*", (req, res) => {
		res.sendStatus(404);
	});
	app.use(error);
};
