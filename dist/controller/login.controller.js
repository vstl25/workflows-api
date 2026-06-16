import { loginService } from "../services/login.service.js";
export const loginController = async (req, res) => {
    try {
        const result = await loginService(req.body);
        res.cookie("token", result.token, {
            httpOnly: true,
            // secure: process.env.NODE_ENV === "production",
            // sameSite: "strict",
        });
        res.status(200).json({
            success: true,
            data: result.user,
        });
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: error.message,
        });
    }
};
