import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { jwtUtils } from "../../utils/jwt.js";
import config from "../../config/index.js";
const loginUserFromDB = async (payload) => {
    const { email, password } = payload;
    if (!email || !password) {
        throw new Error("Provied email and password");
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new Error("User not found");
    }
    const isMatchPassword = await bcrypt.compare(password, user.password);
    if (!isMatchPassword) {
        throw new Error("Invaild creadintials");
    }
    if (user.status === "BLOCKED") {
        throw new Error("your account has been bloked. please contact support");
    }
    const JwtPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    };
    const accessToken = jwtUtils.createToken(JwtPayload, config.jwt_access_secret, config.jwt_access_expire_in);
    const refreshToken = jwtUtils.createToken(JwtPayload, config.jwt_refresh_secret, config.jwt_access_expire_in);
    const loginUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
    };
    return {
        loginUser,
        accessToken,
        refreshToken,
    };
};
const refreshToken = async (token) => {
    if (!token) {
        throw new Error("Your token missing plesse login agin");
    }
    const verifiedToken = jwtUtils.verifiedToken(token, config.jwt_refresh_secret);
    if (!verifiedToken.success) {
        throw new Error(verifiedToken.error);
    }
    const { email, name, id, role } = verifiedToken.data;
    const user = await prisma.user.findUnique({
        where: { id, email, name, role },
    });
    if (!user) {
        throw new Error("User not found please log in again");
    }
    if (user.status === "BLOCKED") {
        throw new Error("your account has been bloked. please contact support");
    }
    const JwtPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    };
    const accessToken = jwtUtils.createToken(JwtPayload, config.jwt_access_secret, config.jwt_access_expire_in);
    return { accessToken };
};
export const authServies = {
    loginUserFromDB,
    refreshToken,
};
//# sourceMappingURL=auth.services.js.map