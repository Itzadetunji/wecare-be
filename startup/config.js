const environmentVariablesList = [
	"MONGO_URI",
	"JWT_PRIVATE_KEY",
	"FRONTEND_BASE_URL",
  "HOST",
  "EMAIL",
  "EMAIL_APP_PASSWORD"
];

export default () => {
	for (let variable of environmentVariablesList) {
		if (!process.env[variable]) {
			throw new Error(`FATAL ERROR: ${variable} is not defined`);
		}
	}
};
