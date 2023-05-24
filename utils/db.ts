import * as mysql2 from "mysql2"
import dotenv from "dotenv"

dotenv.config()

const dbConnection = mysql2.createConnection({
	user: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME
})

const dbWithPromises = dbConnection.promise()

export default dbWithPromises