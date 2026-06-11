import { getFacultiesService, getYearsService, } from "../services/filter.service.js";
export const getFaculties = async (req, res) => {
    try {
        const data = await getFacultiesService();
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
export const getYears = async (req, res) => {
    try {
        const data = await getYearsService();
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
//# sourceMappingURL=filter.controller.js.map