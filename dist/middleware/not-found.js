import httpStatus from "http-status";
export const notFoundHandler = (req, res, next) => {
    res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: `Not Found - Cannot ${req.method} ${req.originalUrl}`,
    });
};
//# sourceMappingURL=not-found.js.map