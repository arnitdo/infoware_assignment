import type {Request} from "express";

export type NoParams = {}

export interface APIRequest<RequestParamT = {}, RequestBodyT = {}, RequestQueryT = {}> extends Request<RequestParamT, {}, RequestBodyT, RequestQueryT, {}> {

}

export interface CreateEmployeeRequestBody {
	employeeName: string
	employeeTitle: string
	employeePhone: string
	employeeMail: string
	employeeAddressStreet: string
	employeeAddressCity: string
	employeeAddressState: string
}

export interface GetEmployeeDetailsRequestParams {
	employeeId: string
}

export interface GetEmployeesDataQuery {
	employeePage: string | undefined
	pageSize: string | undefined
}

export interface UpdateEmployeeRequestParams {
	employeeId: string
}

export interface UpdateEmployeeRequestBody {
	employeeName: string | undefined
	employeeTitle: string | undefined
	employeePhone: string | undefined
	employeeMail: string | undefined
	employeeAddressStreet: string | undefined
	employeeAddressCity: string | undefined
	employeeAddressState: string | undefined,
	primaryAlternateContactId: string | undefined
	secondaryAlternateContactId: string | undefined
}

export interface DeleteEmployeeRequestParams {
	employeeId: string
}

export interface CreateContactRequestBody {
	contactName: string,
	contactPhone: string,
	contactRelation: string
}
