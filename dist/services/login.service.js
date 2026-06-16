import bcrypt from "bcrypt";
import { getUserByEmail } from "../repositories/login.repository.js";
import { generateJWTToken } from "../utility/generateJWTToken.js";
export const loginService = async ({ email, password, }) => {
    const user = await getUserByEmail(email);
    if (!user) {
        throw new Error("Invalid Email or Password");
    }
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
        throw new Error("Invalid Email or Password");
    }
    const token = generateJWTToken({
        user_id: user.id,
        email: user.email,
    });
    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            fullname: user.full_name,
        },
    };
};
