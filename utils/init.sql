CREATE TABLE IF NOT EXISTS employeeContacts
(
    contactId       VARCHAR(36) PRIMARY KEY,
    contactName     VARCHAR(64) NOT NULL,
    contactPhone    VARCHAR(32) NOT NULL,
    contactRelation VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS employeeData
(
    employeeId                  VARCHAR(36) PRIMARY KEY,
    employeeName                VARCHAR(64)  NOT NULL,
    employeeTitle               VARCHAR(32)  NOT NULL,
    employeePhone               VARCHAR(32)  NOT NULL,
    employeeMail                VARCHAR(64)  NOT NULL,
    employeeAddressStreet       VARCHAR(256) NOT NULL,
    employeeAddressCity         VARCHAR(32)  NOT NULL,
    employeeAddressState        VARCHAR(32)  NOT NULL,
    primaryAlternateContactId   VARCHAR(36) DEFAULT NULL,
    secondaryAlternateContactId VARCHAR(36) DEFAULT NULL,

    CONSTRAINT fk_employeeData_employeeContacts_primaryContact_contactId
        FOREIGN KEY (primaryAlternateContactId) REFERENCES employeeContacts (contactId),

    CONSTRAINT fk_employeeData_employeeContacts_secondaryContact_contactId
        FOREIGN KEY (secondaryAlternateContactId) REFERENCES employeeContacts (contactId)
)