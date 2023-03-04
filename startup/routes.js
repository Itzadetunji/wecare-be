import error from "../middleware/Error.js";
import companyRouter from "../routes/company.route.js";

export default (app) => {
  app.use("/api/company", companyRouter);
  app.get("*", (req, res) => {
    res.sendStatus(404);
  });
  app.use(error);
};
