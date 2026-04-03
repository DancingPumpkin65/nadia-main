const { chromium } = require("playwright-core");
const fs = require("fs");

(async () => {
  let browser;
  const filePath = process.argv[2] || "C:/Users/ouass/Downloads/nadia/image.png";
  const manualSelectionArg = process.argv[3] || "";
  try {
    browser = await chromium.launch({
      executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
      headless: true,
    });

    const page = await browser.newPage({ viewport: { width: 1600, height: 1400 } });
    const logs = [];
    page.on("console", (msg) => logs.push(`BROWSER ${msg.type()}: ${msg.text()}`));
    page.on("pageerror", (err) => logs.push(`PAGEERROR: ${err.message}`));

    await page.goto("http://127.0.0.1:4281/?bypassAuth=1", { waitUntil: "networkidle" });
    fs.writeFileSync("app_test_page.html", await page.content());
    await page.screenshot({ path: "app_test_error.png", fullPage: true });
    const inputCount = await page.locator('input[type="file"]').count();
    if (inputCount === 0) {
      fs.writeFileSync(
        "app_test_result.json",
        JSON.stringify(
          {
            ok: false,
            error: "No file input rendered on the app route.",
            logs,
          },
          null,
          2,
        ),
      );
      process.exitCode = 1;
      return;
    }

    await page.setInputFiles('input[type="file"]', filePath);
    if (manualSelectionArg) {
      const originalImage = page.locator('img[alt="Original preview"]');
      await originalImage.waitFor({ state: "visible", timeout: 10000 });
      const bounds = await originalImage.boundingBox();
      if (!bounds) {
        throw new Error("Could not read the original preview bounds for manual selection.");
      }

      const [startXPercent, startYPercent, endXPercent, endYPercent] = manualSelectionArg
        .split(",")
        .map((value) => Number(value.trim()));

      const startX = bounds.x + bounds.width * startXPercent;
      const startY = bounds.y + bounds.height * startYPercent;
      const endX = bounds.x + bounds.width * endXPercent;
      const endY = bounds.y + bounds.height * endYPercent;

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(endX, endY, { steps: 12 });
      await page.mouse.up();
      await page.waitForTimeout(500);
    }

    await page.getByRole("button", { name: "Render" }).click();
    await page.waitForFunction(
      () => {
        const bodyText = document.body.innerText.toUpperCase();
        return (
          !bodyText.includes("RENDERING LOCALLY IN YOUR BROWSER...") &&
          !bodyText.includes("WORKING...")
        );
      },
      { timeout: 20000 },
    ).catch(async () => {
      await page.waitForTimeout(12000);
    });

    const bodyText = await page.locator("body").innerText();
    fs.writeFileSync(
      "app_test_result.json",
      JSON.stringify(
          {
            ok: true,
            filePath,
            manualSelectionArg,
            bodyText,
            logs,
          },
        null,
        2,
      ),
    );
    await page.screenshot({ path: "app_test_shot.png", fullPage: true });
  } catch (error) {
    try {
      if (browser) {
        const pages = browser.contexts().flatMap((context) => context.pages());
        if (pages[0]) {
          const html = await pages[0].content();
          fs.writeFileSync("app_test_page.html", html);
          await pages[0].screenshot({ path: "app_test_error.png", fullPage: true });
        }
      }
    } catch {}
    fs.writeFileSync(
      "app_test_result.json",
      JSON.stringify(
        {
          ok: false,
          error: error instanceof Error ? error.stack : String(error),
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
