import puppeteer from "puppeteer";

export async function renderHtmlToPdf(params: {
  html: string;
  outputPath: string;
  width: number;
  height: number;
}) {
  const browser = await puppeteer.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage();

    await page.setViewport({
      width: params.width,
      height: params.height,
      deviceScaleFactor: 1,
    });

    await page.setContent(params.html);

    try {
      await page.waitForNetworkIdle({
        idleTime: 500,
        timeout: 10000,
      });
    } catch {
      // tetap lanjut generate PDF
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
  } finally {
    await browser.close();
  }
}