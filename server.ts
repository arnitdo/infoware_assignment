import express from "express"
import * as dotenv from 'dotenv'
import employeeRouter from "./routes/employeeRouter";
import {APIRequest} from "./utils/types/apiRequests";
import {APIResponse} from "./utils/types/apiResponses";
import contactRouter from "./routes/contactRouter";

// Load env vars from .env file
dotenv.config()

const expressServer = express()

expressServer.use(
	express.json()
)

expressServer.use(
	"/employees",
	employeeRouter
)

expressServer.use(
	"/contacts",
	contactRouter
)

expressServer.use(
	"*",
	(req: APIRequest, res: APIResponse<{}, {}, {}>) => {
		res.status(404).json({
			responseStatus: "ERR_NOT_FOUND"
		})
	}
)

expressServer.listen(
	process.env.PORT || 8000,
	() => {
		console.debug(`Listening on port ${process.env.PORT || 8000}`)
	}
)