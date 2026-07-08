import jwt from "jsonwebtoken";
const createToken = (payload, secret, expiresIn) => {
    const token = jwt.sign(payload, secret, { expiresIn });
    return token;
};
const verifiedToken = (token, secret) => {
    //  const verifiedToken=jwt.verify(token,secret);
    //  return verifiedToken;
    try {
        const verifiedToken = jwt.verify(token, secret);
        return {
            success: true,
            data: verifiedToken,
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message,
        };
    }
};
export const jwtUtils = {
    createToken,
    verifiedToken,
};
//# sourceMappingURL=jwt.js.map