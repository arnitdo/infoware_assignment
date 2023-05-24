export type EmployeeContacts = {
	contactId: string
	contactName: string
	contactPhone: string
	contactRelation: string
}

export type EmployeeData = {
	employeeId: string
	employeeName: string
	employeeTitle: string
	employeePhone: string
	employeeMail: string
	employeeAddressStreet: string
	employeeAddressCity: string
	employeeAddressState: string
	primaryAlternateContactId: string | null
	secondaryAlternateContactId: string | null
}