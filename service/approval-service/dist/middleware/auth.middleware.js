import jwt from "jsonwebtoken";
export function verifyToken(req, res, next) {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) {
        return res.status(403).json({
            status: "error",
            message: "Akses ditolak. Token tidak disediakan.",
        });
    }
    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("JWT_SECRET hilang");
        }
        const decoded = jwt.verify(token, jwtSecret);
        const user = {
            id_user: decoded.id_user,
            email: decoded.email,
            role: decoded.role,
            id_unit: decoded.id_unit,
        };
        req.user = user;
        next();
    }
    catch (error) {
        return res.status(401).json({
            status: "error",
            message: "Sesi tidak valid atau telah kedaluwarsa. Silakan login kembali.",
        });
    }
}
//# sourceMappingURL=auth.middleware.js.map