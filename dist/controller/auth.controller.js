import { authService } from "../services/auth.service.js";
const REFRESH_COOKIE_NAME = "refresh_token";
const ACCESS_COOKIE_NAME = "access_token";
const getCookieValue = (cookieHeader, name) => {
    if (!cookieHeader)
        return null;
    const cookies = cookieHeader.split("; ");
    for (const cookie of cookies) {
        const [key, value] = cookie.split("=");
        if (key === name) {
            return decodeURIComponent(value ?? "");
        }
    }
    return null;
};
const buildAccessCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,
    path: "/",
});
export const loginController = async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        res.cookie(ACCESS_COOKIE_NAME, result.accessToken, result.accessCookieOptions);
        res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, result.refreshCookieOptions);
        res.status(200).json({
            success: true,
            data: {
                user: result.user,
            },
        });
    }
    catch (error) {
        res.status(401).json({ success: false, message: error.message });
    }
};
export const refreshController = async (req, res) => {
    try {
        const refreshToken = getCookieValue(req.headers.cookie, REFRESH_COOKIE_NAME);
        if (!refreshToken) {
            res.status(401).json({ success: false, message: "Refresh token missing" });
            return;
        }
        const accessToken = await authService.refresh(refreshToken);
        res.cookie(ACCESS_COOKIE_NAME, accessToken, buildAccessCookieOptions());
        res.status(200).json({ success: true, data: { user: null } });
    }
    catch (error) {
        res.status(401).json({ success: false, message: error.message });
    }
};
export const logoutController = async (req, res) => {
    try {
        const refreshToken = getCookieValue(req.headers.cookie, REFRESH_COOKIE_NAME);
        if (!refreshToken) {
            res.status(400).json({ success: false, message: "Refresh token missing" });
            return;
        }
        await authService.logout(refreshToken);
        res.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });
        res.clearCookie(ACCESS_COOKIE_NAME, { path: "/" });
        res.status(200).json({ success: true, message: "Logged out" });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
