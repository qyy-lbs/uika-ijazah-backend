import puppeteer from "puppeteer";
export async function renderHtmlToPdf(params) {
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    try {
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(60000);
        page.setDefaultTimeout(60000);
        page.on("requestfailed", (request) => {
            const url = request.url();
            if (url.includes("/uploads/") ||
                url.includes("fonts.googleapis.com") ||
                url.includes("fonts.gstatic.com") ||
                url.endsWith(".png") ||
                url.endsWith(".jpg") ||
                url.endsWith(".jpeg") ||
                url.endsWith(".webp")) {
                console.error("Gagal load asset PDF:", {
                    url,
                    error: request.failure()?.errorText,
                });
            }
        });
        await page.setViewport({
            width: params.width,
            height: params.height,
            deviceScaleFactor: 1,
        });
        await page.setContent(params.html, {
            waitUntil: "domcontentloaded",
            timeout: 60000,
        });
        try {
            await page.waitForNetworkIdle({
                idleTime: 500,
                timeout: 5000,
            });
        }
        catch {
            console.warn("Network idle timeout, PDF tetap dilanjutkan.");
        }
        await page.pdf({
            path: params.outputPath,
            printBackground: true,
            width: `${params.width}px`,
            height: `${params.height}px`,
            margin: {
                top: "0px",
                right: "0px",
                bottom: "0px",
                left: "0px",
            },
        });
    }
    finally {
        await browser.close();
    }
}
//# sourceMappingURL=pdf-renderer.service.js.map