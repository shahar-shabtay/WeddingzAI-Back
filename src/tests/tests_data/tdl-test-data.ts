import { IUser } from "../../models/user-model";
import { ITodo, ISection, ITDL } from "../../models/tdl-model";

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

