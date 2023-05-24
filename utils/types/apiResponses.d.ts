import type {Response} from "express"
import {EmployeeContacts, EmployeeData} from "./tableSchema";

export type APIStatusCode =
	200 | 400 | 404 | 500

export type APIResponseStatus =
/* 2xx */
	"SUCCESS" |

	/* 5xx */
	"ERR_INTERNAL_ERROR" |

	/* 404 */
	"ERR_NOT_FOUND" |

	/* 400 */
	`ERR_INVALID_${
		"URL" | "QUERY" | "BODY"
	}_PARAMS` |
	`ERR_MISSING_${
		"URL" | "QUERY" | "BODY"
	}_PARAMS` |

	/* 405 */
	"ERR_INVALID_METHOD"

export interface APIResponseData<RequestParamT extends {}, RequestBodyT extends {}, RequestQueryT extends {}> {
	responseStatus: APIResponseStatus
	invalidParams?: ((keyof RequestParamT) | (keyof RequestBodyT) | (keyof RequestQueryT))[]
	missingParams?: ((keyof RequestParamT) | (keyof RequestBodyT) | (keyof RequestQueryT))[]
}

export interface APIResponse<RequestParamT extends {}, RequestBodyT extends {}, RequestQueryT extends {}> extends Response {
	status: (statusCode: APIStatusCode) => APIResponse<RequestParamT, RequestBodyT, RequestQueryT>,
	json: <JSONResponseT extends APIResponseData<RequestParamT, RequestBodyT, RequestQueryT> = APIResponseData<RequestParamT, RequestBodyT, RequestQueryT>>(responseBody: JSONResponseT) => void
}

export interface CreateEmployeeResponse extends APIResponseData<{}, {}, {}> {
	employeeId: string
}

export interface GetEmployeeResponse extends APIResponseData<{}, {}, {}> {
	employeeData:
		Omit<
			EmployeeData,
			"primaryAlternateContactId" | "secondaryAlternateContactId"
		> & {
		primaryContact: EmployeeContacts | null,
		secondaryContact: EmployeeContacts | null
	}
}

export interface GetEmployeesResponse extends APIResponseData<{}, {}, {}> {
	employeesData: EmployeeData[]
}

export interface UpdateEmployeeResponse extends APIResponseData<{}, {}, {}> {
	employeeData: EmployeeData
}

export interface CreateContactResponse extends APIResponseData<{}, {}, {}> {
	contactId: string
}