import { getDashboardSummaryService, getLatestValidationService, } from "../services/dashboard.service.js";
export const getDashboardSummary = async (req, res) => {
    try {
        const data = await getDashboardSummaryService();
        res.status(200).json({
            success: true,
            data,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
export const getLatestValidations = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = String(req.query.search || "");
        const data = await getLatestValidationService(page, limit, search);
        res.status(200).json({
            success: true,
            ...data,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
//# sourceMappingURL=dashboard.controller.js.map