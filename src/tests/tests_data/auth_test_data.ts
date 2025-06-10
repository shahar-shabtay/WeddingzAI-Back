// Post data

import { IUser } from "../../models/user-model";

type User = IUser & {
    accessToken?: string;
    refreshToken?: string;
}

export const testUser: User = {
    firstPartner: "Gabi",
    secondPartner: "Michal",
    bookedVendors: [],
    myVendors: [],
    email: "gabi@weddinzai.com",
    password: "password123"
}

export const testUser2: User = {
    firstPartner: "Gal",
    secondPartner: "Romi",
    bookedVendors: [],
    myVendors: [],
    email: "gal@weddinzai.com",
    password: "password123"
}

export const premiumUser: User = {
    firstPartner: "premium",
    secondPartner: "User",
    bookedVendors: [],
    myVendors: [],
    email: "premium@weddinzai.com",
    password: "password123",
    is_premium: true
}

export const invalidEmailTestUser: User = {
    firstPartner: "Test",
    secondPartner: "Test",
    bookedVendors: [],
    myVendors: [],
    email: "test@weddinzai",
    password: "password123"
}

export const noPasswordTestUser: User = {
    firstPartner: "Test",
    secondPartner: "Test",
    bookedVendors: [],
    myVendors: [],
    email: "test@weddinzai",
    password: ""
}

export const shortPasswordTestUser: User = {
    firstPartner: "",
    secondPartner: "",
    bookedVendors: [],
    myVendors: [],
    email: "test@weddinzai.com",
    password: "123"
}

export const MissingFieldsTestUser: User = {
    firstPartner: "",
    secondPartner: "",
    bookedVendors: [],
    myVendors: [],
    email: "",
    password: ""
}
