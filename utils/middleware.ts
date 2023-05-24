import {APIRequest} from "./types/apiRequests";
import {APIResponse} from "./types/apiResponses";

import type {NextFunction} from "express"

export type MiddlewareFunction<
	RequestParamsT extends {} = {},
	RequestBodyT extends {} = {},
	RequestQueryT extends {} = {}
> = (
	req: APIRequest<RequestParamsT, RequestBodyT, RequestQueryT>,
	res: APIResponse<RequestParamsT, RequestBodyT, RequestQueryT>,
	next: NextFunction
) => (void | Promise<void>)

export type RequestMethod = "GET" | "PUT" | "DELETE" | "POST"

export type ValidationMap<T extends {}> = {
	[propertyName in keyof T]: (propertyValue: T[propertyName]) => (boolean | Promise<boolean>)
}

export type ValidationResultMap<T extends {}> = {
	[propertyName in keyof T]: boolean
}

/**
 * @description Validate the method "GET", "POST", etc. of the incoming request. Respond with 405 Method Not Allowed if invalid
 * @param reqMethods Valid HTTP Request Verb
 * @see RequestMethod
 * */
export function requireMethods<RequestParamsT extends {}, RequestBodyT extends {}, RequestQueryT extends {}>(...reqMethods: RequestMethod[]): MiddlewareFunction<RequestParamsT, RequestBodyT, RequestQueryT> {
	return function (req, res, next) {
		const incomingRequestMethod = req.method as RequestMethod
		if (reqMethods.includes(incomingRequestMethod)) {
			next()
		} else {
			res.status(400).json({
				responseStatus: "ERR_INVALID_METHOD"
			})
		}
	}
}


/**
 * @description Ensures that all body params are provided in the request url. Respond with HTTP 400 if not. Note that this does not validate the URL Param values, only ensures that their corresponding keys are set
 * @see APIRequest
 * */
export function requireURLParams<RequestParamsT extends {}, RequestBodyT extends {}, RequestQueryT extends {}>(...requiredParams: (keyof RequestParamsT)[]): MiddlewareFunction<RequestParamsT, RequestBodyT, RequestQueryT> {
	return function (req, res, next) {
		if (req.params === null) {
			res.status(400).json({
				responseStatus: "ERR_MISSING_BODY_PARAMS",
				missingParams: requiredParams
			})
			return
		}

		// @ts-ignore
		const bodyKeys = Object.keys(req.params)
		const missingKeys: Set<(keyof RequestParamsT)> = new Set<keyof RequestParamsT>()
		for (const requiredParamKey of requiredParams) {
			// @ts-ignore
			if (!bodyKeys.includes(requiredParamKey)) {
				missingKeys.add((requiredParamKey))
			}
			const keyValue = req.params[requiredParamKey]
			if (keyValue === undefined) {
				missingKeys.add((requiredParamKey))
			}
		}
		if (missingKeys.size > 0) {
			const missingKeyArray = Array.from(missingKeys)
			res.status(400).json({
				responseStatus: "ERR_MISSING_URL_PARAMS",
				missingParams: missingKeyArray
			})
		} else {
			next()
		}
	}
}


/**
 * @description Ensures that all body params are provided in the request body. Respond with HTTP 400 if not. Note that this does not validate the body values, only ensures that their corresponding keys are set
 * @see APIRequest
 * */
export function requireBodyParams<RequestParamsT extends {}, RequestBodyT extends {}, RequestQueryT extends {}>(...requiredParams: (keyof RequestBodyT)[]): MiddlewareFunction<RequestParamsT, RequestBodyT, RequestQueryT> {
	return function (req, res, next) {
		if (req.body === null) {
			res.status(400).json({
				responseStatus: "ERR_MISSING_BODY_PARAMS",
				missingParams: requiredParams
			})
			return
		}

		// @ts-ignore
		const bodyKeys = Object.keys(req.body) as (keyof RequestBodyT[])
		const missingKeys: Set<(keyof RequestBodyT)> = new Set<keyof RequestBodyT>()
		for (const requiredParamKey of requiredParams) {
			// @ts-ignore
			if (!bodyKeys.includes(requiredParamKey)) {
				missingKeys.add((requiredParamKey))
			}
			const keyValue = req.body[requiredParamKey]
			if (keyValue === undefined) {
				missingKeys.add((requiredParamKey))
			}
		}
		if (missingKeys.size > 0) {
			const missingKeyArray = Array.from(missingKeys)
			res.status(400).json({
				responseStatus: "ERR_MISSING_BODY_PARAMS",
				missingParams: missingKeyArray
			})
		} else {
			next()
		}
	}
}

/**
 * @description Ensures that all query params are provided in the url query. Respond with HTTP 400 if not. Note that this does not validate the query values, only ensures that their corresponding keys are set
 * @see APIRequest
 * */
export function requireQueryParams<RequestParamsT extends {}, RequestBodyT extends {}, RequestQueryT extends {}>(...requiredParams: (keyof RequestQueryT)[]): MiddlewareFunction<RequestParamsT, RequestBodyT, RequestQueryT> {
	return function (req, res, next) {
		if (req.query === null) {
			res.status(400).json({
				responseStatus: "ERR_MISSING_BODY_PARAMS",
				missingParams: requiredParams
			})
			return
		}

		// @ts-ignore
		const bodyKeys = Object.keys(req.query)
		const missingKeys: Set<(keyof RequestQueryT)> = new Set<keyof RequestQueryT>()
		for (const requiredParamKey of requiredParams) {
			// @ts-ignore
			if (!bodyKeys.includes(requiredParamKey)) {
				missingKeys.add((requiredParamKey))
			}
			const keyValue = req.query[requiredParamKey]
			if (keyValue === undefined) {
				missingKeys.add((requiredParamKey))
			}
		}
		if (missingKeys.size > 0) {
			const missingKeyArray = Array.from(missingKeys)
			res.status(400).json({
				responseStatus: "ERR_MISSING_QUERY_PARAMS",
				missingParams: missingKeyArray
			})
		} else {
			next()
		}
	}
}

/**
 * @description Validates all url parameters. Responds with HTTP 400 if any invalid parameters are found
 * @see APIResponseData
 * */
export function requireURLParamValidation<RequestParamsT extends {}, RequestBodyT extends {}, RequestQueryT extends {}>(bodyValidators: ValidationMap<RequestParamsT>): MiddlewareFunction<RequestParamsT, RequestBodyT, RequestQueryT> {
	return async function (req, res, next) {
		// @ts-ignore
		const resultMap: ValidationResultMap<RequestParamsT> = {}
		const requestParams = req.params
		const queryKeys = Object.keys(requestParams) as (keyof RequestParamsT)[]
		for (const queryKey of queryKeys) {
			const validationFn = bodyValidators[queryKey]
			const paramValue = req.params[queryKey]
			const validationFnResult = await validationFn(paramValue)
			resultMap[queryKey] = validationFnResult
		}
		const validationResultValues = Object.values(resultMap) as boolean[]
		const resultValueAcc = validationResultValues.reduce((previousValue, currentValue) => {
			return previousValue && currentValue
		}, true)

		// Some properties are invalid
		if (resultValueAcc === false) {
			const allEntries = Object.entries(resultMap) as [string, boolean][]
			const invalidEntries = allEntries.filter((entryPair) => {
				const [objectKey, valueValid] = entryPair
				return !valueValid
			})
			const mappedInvalidKeyList = invalidEntries.map((invalidEntry) => {
				const [objectKey, valueValid] = invalidEntry
				return objectKey as keyof RequestParamsT
			})
			res.status(400).json({
				responseStatus: "ERR_INVALID_URL_PARAMS",
				invalidParams: mappedInvalidKeyList
			})
		} else {
			next()
		}
	}
}


/**
 * @description Validates all body parameters. Responds with HTTP 400 if any invalid parameters are found
 * @see APIResponseData
 * */
export function requireBodyParamValidation<RequestParamsT extends {}, RequestBodyT extends {}, RequestQueryT extends {}>(bodyValidators: ValidationMap<RequestBodyT>): MiddlewareFunction<RequestParamsT, RequestBodyT, RequestQueryT> {
	return async function (req, res, next) {
		// @ts-ignore
		const resultMap: ValidationResultMap<RequestBodyT> = {}
		const requestBody = req.body
		const bodyKeys = Object.keys(bodyValidators) as (keyof RequestBodyT)[]
		for (const bodyKey of bodyKeys) {
			const validationFn = bodyValidators[bodyKey]
			const bodyValue = req.body[bodyKey]
			const validationFnResult = await validationFn(bodyValue)
			resultMap[bodyKey] = validationFnResult
		}
		const validationResultValues = Object.values(resultMap) as boolean[]
		const resultValueAcc = validationResultValues.reduce((previousValue, currentValue) => {
			return previousValue && currentValue
		}, true)

		// Some properties are invalid
		if (resultValueAcc === false) {
			const allEntries = Object.entries(resultMap) as [string, boolean][]
			const invalidEntries = allEntries.filter((entryPair) => {
				const [objectKey, valueValid] = entryPair
				return !valueValid
			})
			const mappedInvalidKeyList = invalidEntries.map((invalidEntry) => {
				const [objectKey, valueValid] = invalidEntry
				return objectKey as keyof RequestBodyT
			})
			res.status(400).json({
				responseStatus: "ERR_INVALID_BODY_PARAMS",
				invalidParams: mappedInvalidKeyList
			})
		} else {
			next()
		}
	}
}

/**
 * @description Validates all query parameters. Responds with HTTP 400 if any invalid parameters are found
 * @see APIResponseData
 * */
export function requireQueryParamValidation<RequestParamsT extends {}, RequestBodyT extends {}, RequestQueryT extends {}>(bodyValidators: ValidationMap<RequestQueryT>): MiddlewareFunction<RequestParamsT, RequestBodyT, RequestQueryT> {
	return async function (req, res, next) {
		// @ts-ignore
		const resultMap: ValidationResultMap<RequestQueryT> = {}
		const requestQuery = req.query
		const queryKeys = Object.keys(requestQuery) as (keyof RequestQueryT)[]
		for (const queryKey of queryKeys) {
			const validationFn = bodyValidators[queryKey]
			const bodyValue = req.query[queryKey]
			const validationFnResult = await validationFn(bodyValue)
			resultMap[queryKey] = validationFnResult
		}
		const validationResultValues = Object.values(resultMap) as boolean[]
		const resultValueAcc = validationResultValues.reduce((previousValue, currentValue) => {
			return previousValue && currentValue
		}, true)

		// Some properties are invalid
		if (resultValueAcc === false) {
			const allEntries = Object.entries(resultMap) as [string, boolean][]
			const invalidEntries = allEntries.filter((entryPair) => {
				const [objectKey, valueValid] = entryPair
				return !valueValid
			})
			const mappedInvalidKeyList = invalidEntries.map((invalidEntry) => {
				const [objectKey, valueValid] = invalidEntry
				return objectKey as keyof RequestQueryT
			})
			res.status(400).json({
				responseStatus: "ERR_INVALID_QUERY_PARAMS",
				invalidParams: mappedInvalidKeyList
			})
		} else {
			next()
		}
	}
}
