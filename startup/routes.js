import error from "../middleware/Error.js";
import userRouter from "../routes/user.js";

export default (app) => {
  app.use("/api/users", userRouter);
  app.get("*", (req, res) => {
    res.sendStatus(404);
  });
  app.use(error);
};
