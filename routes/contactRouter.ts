import {Router} from "express";
import {APIRequest, CreateContactRequestBody, NoParams} from "../utils/types/apiRequests";
import {APIResponse, CreateContactResponse} from "../utils/types/apiResponses";
import db from "../utils/db";
import {v4} from "uuid";
import {requireBodyParams, requireBodyParamValidation, requireMethods} from "../utils/middleware";
import {REGEXP_CHECK, STRLEN_NZ} from "../utils/validatorUtils";

async function createContact(
	req: APIRequest<NoParams, CreateContactRequestBody, NoParams>,
	res: APIResponse<NoParams, CreateContactRequestBody, NoParams>
) {
	try {
		const {
			contactRelation, contactPhone, contactName
		} = req.body

		const newContactId = v4()

		await db.execute(
			`INSERT INTO employeeContacts
             VALUES (?, ?, ?, ?)`,
			[newContactId, contactName, contactPhone, contactRelation]
		)

		res.status(200).json<CreateContactResponse>({
			responseStatus: "SUCCESS",
			contactId: newContactId
		})
	} catch (e) {
		console.error(e)
		res.status(500).json({
			responseStatus: "ERR_INTERNAL_ERROR"
		})
	}
}

const contactRouter = Router({
	mergeParams: true,
	caseSensitive: false
})

contactRouter.post<
	"/",
	NoParams,
	CreateContactRequestBody
>(
	"/",
	requireMethods("POST"),
	requireBodyParams("contactName", "contactPhone", "contactRelation"),
	requireBodyParamValidation({
		contactName: STRLEN_NZ,
		contactPhone: REGEXP_CHECK(/^(\+[0-9]{2,3}(\s|-)?)?[0-9]+$/gi),
		contactRelation: STRLEN_NZ
	}),
	createContact
)

export default contactRouter