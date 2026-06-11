import { getStatistikTahunanService, getStatistikValidasiService, } from "../services/statistik.service.js";
export const getStatistikTahunan = async (req, res) => {
    try {
        const data = await getStatistikTahunanService();
        res.status(200).json({
            success: true,
            raw: data,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            raw: [],
        });
    }
};
export const getStatistikValidasi = async (req, res) => {
    try {
        const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
        const data = await getStatistikValidasiService(year);
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
//# sourceMappingURL=statistik.controller.js.map