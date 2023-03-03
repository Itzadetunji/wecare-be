const environmentVariablesList = [
	"DB_CONN_STRING",
	"JWT_PRIVATE_KEY",
	"FRONTEND_BASE_URL",
];

export default () => {
	for (let variable of environmentVariablesList) {
		if (!process.env[variable]) {
			throw new Error(`FATAL ERROR: ${variable} is not defined`);
		}
	}
};
