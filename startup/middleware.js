import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import logger from "morgan";
import helmet from "helmet";
import xss from "xss-clean";

const trimmer = (req, res, next) => {
	if (req.method === "POST") {
		for (const [key, value] of Object.entries(req.body)) {
			if (typeof value === "string") req.body[key] = value.trim();
		}
	}
	next();
};

export default (app) => {
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(bodyParser.json());
	app.use(logger("dev"));
	app.use(cors({ origin: "http://localhost:3010", credentials: true }));
	app.use(xss());
	app.use(cookieParser());
	app.use(helmet());
	app.use(trimmer);
};
