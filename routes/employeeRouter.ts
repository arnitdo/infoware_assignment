import {
	APIRequest,
	CreateEmployeeRequestBody,
	DeleteEmployeeRequestParams,
	GetEmployeeDetailsRequestParams,
	GetEmployeesDataQuery,
	NoParams,
	UpdateEmployeeRequestBody,
	UpdateEmployeeRequestParams
} from "../utils/types/apiRequests";
import {
	APIResponse,
	CreateEmployeeResponse,
	GetEmployeeResponse,
	GetEmployeesResponse,
	UpdateEmployeeResponse
} from "../utils/types/apiResponses";
import {Router} from "express";
import {
	requireBodyParams,
	requireBodyParamValidation,
	requireMethods,
	requireQueryParamValidation,
	requireURLParams,
	requireURLParamValidation
} from "../utils/middleware";
import {
	ALLOW_NULLISH_WITH_FN,
	NON_ZERO_NON_NEGATIVE,
	REGEXP_CHECK,
	STRING_TO_NUM_FN,
	STRLEN_NZ,
	VALID_EMPLOYEE_ID_CHECK
} from "../utils/validatorUtils";
import {v4} from "uuid";
import db from "../utils/db";
import {EmployeeContacts, EmployeeData} from "../utils/types/tableSchema";

async function createEmployee(
	req: APIRequest<NoParams, CreateEmployeeRequestBody>,
	res: APIResponse<NoParams, NoParams, CreateEmployeeRequestBody>
) {
	try {
		const newEmployeeId = v4()

		const {
			employeeName,
			employeeMail,
			employeeAddressState,
			employeeAddressStreet,
			employeeAddressCity,
			employeeTitle,
			employeePhone
		} = req.body

		const dbResponse = await db.execute(
			`INSERT INTO employeeData (employeeId, employeeName, employeeTitle, employeePhone, employeeMail,
                                       employeeAddressStreet, employeeAddressCity, employeeAddressState)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             RETURNING employeeId`,
			[newEmployeeId, employeeName, employeeTitle, employeePhone, employeeMail, employeeAddressStreet, employeeAddressCity, employeeAddressState]
		)

		const [createdEmployeeData] = dbResponse
		// @ts-ignore
		const {employeeId} = createdEmployeeData[0] as Pick<EmployeeData, "employeeId">

		res.status(200).json<CreateEmployeeResponse>({
			responseStatus: "SUCCESS",
			employeeId: employeeId
		})
	} catch (err) {
		console.error(err)
		res.status(500).json({
			responseStatus: "ERR_INTERNAL_ERROR"
		})
	}
}

async function getEmployeeDetails(
	req: APIRequest<GetEmployeeDetailsRequestParams, NoParams, NoParams>,
	res: APIResponse<GetEmployeeDetailsRequestParams, NoParams, NoParams>
) {
	try {
		const {employeeId} = req.params

		const dbResponse = await db.execute(
			`SELECT *
             FROM employeeData
             WHERE employeeId = ?`,
			[employeeId]
		)

		const [rowData] = dbResponse
		const dbRowData = rowData as EmployeeData[]
		const selectedEmployee = dbRowData[0]

		const {primaryAlternateContactId, secondaryAlternateContactId} = selectedEmployee

		let primaryEmployeeContact: EmployeeContacts | null = null
		if (primaryAlternateContactId != null) {
			const [dbRows] = await db.execute(
				`SELECT *
                 FROM employeeContacts
                 WHERE contactId = ?`,
				[primaryAlternateContactId]
			)
			const contactRows = dbRows as EmployeeContacts[]
			primaryEmployeeContact = contactRows[0]
		}

		let secondaryEmployeeContact: EmployeeContacts | null = null
		if (primaryAlternateContactId != null) {
			const [dbRows] = await db.execute(
				`SELECT *
                 FROM employeeContacts
                 WHERE contactId = ?`,
				[secondaryAlternateContactId]
			)
			const contactRows = dbRows as EmployeeContacts[]
			secondaryEmployeeContact = contactRows[0]
		}

		res.status(200).json<GetEmployeeResponse>({
			responseStatus: "SUCCESS",
			employeeData: {
				...selectedEmployee,
				primaryContact: primaryEmployeeContact,
				secondaryContact: secondaryEmployeeContact
			}
		})

	} catch (err) {
		console.error(err)
		res.status(500).json({
			responseStatus: "ERR_INTERNAL_ERROR"
		})
	}
}

async function updateEmployee(
	req: APIRequest<UpdateEmployeeRequestParams, UpdateEmployeeRequestBody>,
	res: APIResponse<UpdateEmployeeRequestParams, UpdateEmployeeRequestBody, NoParams>
) {
	try {
		const {employeeId: paramEmpId} = req.params

		const [dbRows] = await db.execute(
			`SELECT *
             FROM employeeData
             WHERE employeeId = ?`,
			[paramEmpId]
		)

		// @ts-ignore
		const currentUserData = dbRows[0] as EmployeeData

		const mergeDataObject: any = {
			employeeId: paramEmpId
		}

		const fixedProperties: (
			Exclude<
				keyof EmployeeData,
				"employeeId" | "primaryAlternateContactId" | "secondaryAlternateContactId"
			>
			)[] = [
			"employeeTitle", "employeeMail", "employeePhone", "employeeName", "employeeAddressStreet",
			"employeeAddressCity", "employeeAddressState"
		]

		for (const fixedProperty of fixedProperties) {
			// These properties cannot be null, hence we can only overwrite those that are provided
			const existingProperty = currentUserData[fixedProperty]
			const newProperty = req.body[fixedProperty]
			if (newProperty === undefined) {
				mergeDataObject[fixedProperty] = existingProperty
			} else {
				mergeDataObject[fixedProperty] = newProperty
			}
		}

		const dynamicProperties: ("primaryAlternateContactId" | "secondaryAlternateContactId")[] = [
			"primaryAlternateContactId", "secondaryAlternateContactId"
		]

		for (const dynamicProperty of dynamicProperties) {
			const existingProperty = currentUserData[dynamicProperty]
			const newProperty = req.body[dynamicProperty]
			mergeDataObject[dynamicProperty] = newProperty ?? null
		}

		const finalMergedData = mergeDataObject as EmployeeData

		const {
			employeeId,
			employeeName,
			employeePhone,
			employeeTitle,
			employeeMail,
			employeeAddressState,
			employeeAddressStreet,
			employeeAddressCity,
			primaryAlternateContactId,
			secondaryAlternateContactId
		} = finalMergedData

		await db.execute(
			`UPDATE employeeData
             SET employeeId                  = ?,
                 employeeName                = ?,
                 employeePhone               = ?,
                 employeeTitle               = ?,
                 employeeMail                = ?,
                 employeeAddressStreet       = ?,
                 employeeAddressCity         = ?,
                 employeeAddressState        = ?,
                 primaryAlternateContactId   = ?,
                 secondaryAlternateContactId = ?
             WHERE employeeId = ?`,
			[employeeId, employeeName, employeePhone, employeeTitle, employeeMail, employeeAddressStreet, employeeAddressCity, employeeAddressState,
				primaryAlternateContactId, secondaryAlternateContactId, employeeId]
		)

		res.status(200).json<UpdateEmployeeResponse>({
			responseStatus: "SUCCESS",
			employeeData: finalMergedData
		})
	} catch (err) {
		console.error(err)
		res.status(500).json({
			responseStatus: "ERR_INTERNAL_ERROR"
		})
	}
}

async function deleteEmployee(
	req: APIRequest<DeleteEmployeeRequestParams, NoParams, NoParams>,
	res: APIResponse<DeleteEmployeeRequestParams, NoParams, NoParams>
) {
	try {
		const {employeeId} = req.params

		await db.execute(
			`DELETE
             FROM employeeData
             WHERE employeeId = ?`,
			[employeeId]
		)

		res.status(200).json({
			responseStatus: "SUCCESS"
		})
	} catch (err) {
		console.error(err)
		res.status(500).json({
			responseStatus: "ERR_INTERNAL_ERROR"
		})
	}
}

async function getEmployeesData(
	req: APIRequest<NoParams, NoParams, GetEmployeesDataQuery>,
	res: APIResponse<NoParams, NoParams, GetEmployeesDataQuery>
) {
	try {
		const employeePage = req.query.employeePage || "1"
		const pageSize = req.query.pageSize || "10"
		const parsedEmployeePage = Number.parseInt(employeePage)
		const parsedPageSize = Number.parseInt(pageSize)
		const pageOffset = (parsedEmployeePage - 1) * parsedPageSize

		const [employeesData] = await db.execute(
			`SELECT *
             FROM employeeData
             LIMIT ? OFFSET ?`,
			[pageSize, pageOffset]
		)

		const selectedEmpData = employeesData as EmployeeData[]
		res.status(200).json<GetEmployeesResponse>({
			responseStatus: "SUCCESS",
			employeesData: selectedEmpData
		})

	} catch (err) {
		console.error(err)
		res.status(500).json({
			responseStatus: "ERR_INTERNAL_ERROR"
		})
	}
}

const employeeRouter = Router({
	mergeParams: true,
	caseSensitive: false
})

employeeRouter.post<
	"/",
	NoParams,
	CreateEmployeeRequestBody
>(
	"/",
	requireMethods("POST"),
	requireBodyParams(
		"employeeName", "employeeTitle", "employeeMail", "employeePhone",
		"employeeAddressStreet", "employeeAddressCity", "employeeAddressState"
	),
	requireBodyParamValidation({
		employeeName: STRLEN_NZ,
		employeeTitle: STRLEN_NZ,
		employeePhone: REGEXP_CHECK(/^(\+[0-9]{2,3}(\s|-)?)?[0-9]+$/gi),
		employeeMail: STRLEN_NZ,
		employeeAddressState: STRLEN_NZ,
		employeeAddressStreet: STRLEN_NZ,
		employeeAddressCity: STRLEN_NZ
	}),
	createEmployee
)

employeeRouter.get<
	"/",
	NoParams,
	NoParams,
	GetEmployeesDataQuery, // TS acts weirdly, need to repeat Query type twice for typedefs to work
	GetEmployeesDataQuery
>(
	"/",
	requireMethods("GET"),
	requireQueryParamValidation({
		employeePage: ALLOW_NULLISH_WITH_FN(
			STRING_TO_NUM_FN(
				NON_ZERO_NON_NEGATIVE
			)
		),
		pageSize: ALLOW_NULLISH_WITH_FN(
			STRING_TO_NUM_FN(
				NON_ZERO_NON_NEGATIVE
			)
		),
	}),
	getEmployeesData
)

employeeRouter.get<
	"/:employeeId",
	GetEmployeeDetailsRequestParams
>(
	"/:employeeId",
	requireMethods("GET"),
	requireURLParams("employeeId"),
	requireURLParamValidation({
		employeeId: VALID_EMPLOYEE_ID_CHECK
	}),
	getEmployeeDetails
)

employeeRouter.put<
	"/:employeeId",
	UpdateEmployeeRequestParams,
	NoParams,
	UpdateEmployeeRequestBody
>(
	"/:employeeId",
	requireMethods("PUT"),
	requireURLParams("employeeId"),
	requireURLParamValidation({
		employeeId: VALID_EMPLOYEE_ID_CHECK
	}),
	requireBodyParamValidation({
		employeeName: ALLOW_NULLISH_WITH_FN(STRLEN_NZ),
		employeeTitle: ALLOW_NULLISH_WITH_FN(STRLEN_NZ),
		employeePhone: ALLOW_NULLISH_WITH_FN(REGEXP_CHECK(/^(\+[0-9]{2,3}(\s|-)?)?[0-9]+$/gi)),
		employeeMail: ALLOW_NULLISH_WITH_FN(STRLEN_NZ),
		employeeAddressState: ALLOW_NULLISH_WITH_FN(STRLEN_NZ),
		employeeAddressStreet: ALLOW_NULLISH_WITH_FN(STRLEN_NZ),
		employeeAddressCity: ALLOW_NULLISH_WITH_FN(STRLEN_NZ),
		primaryAlternateContactId: ALLOW_NULLISH_WITH_FN(STRLEN_NZ),
		secondaryAlternateContactId: ALLOW_NULLISH_WITH_FN(STRLEN_NZ)
	}),
	updateEmployee
)

employeeRouter.delete<
	"/:employeeId",
	DeleteEmployeeRequestParams
>(
	"/:employeeId",
	requireMethods("DELETE"),
	requireURLParams("employeeId"),
	requireURLParamValidation({
		employeeId: VALID_EMPLOYEE_ID_CHECK
	}),
	deleteEmployee
)
export default employeeRouter