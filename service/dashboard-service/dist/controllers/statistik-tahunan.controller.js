import { getStatistikTahunanService, } from "../services/statistik-tahunan.service.js";
export const getStatistikTahunan = async (req, res) => {
    try {
        const data = await getStatistikTahunanService();
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
//# sourceMappingURL=statistik-tahunan.controller.js.map