export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureSeedToken } = await import("./lib/queries");
    await ensureSeedToken().catch((e) =>
      console.error("[lum] failed to seed enroll token:", e)
    );

    if (process.env.LUM_DISABLE_CVE_SYNC !== "1") {
      const { startCveSyncLoop } = await import("./lib/cve-sync");
      startCveSyncLoop();
    }
  }
}
