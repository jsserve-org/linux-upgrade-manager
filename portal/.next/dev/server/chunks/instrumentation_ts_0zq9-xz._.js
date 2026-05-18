module.exports = [
"[project]/instrumentation.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "register",
    ()=>register
]);
async function register() {
    if ("TURBOPACK compile-time truthy", 1) {
        const { ensureSeedToken } = await __turbopack_context__.A("[project]/lib/queries.ts [instrumentation] (ecmascript, async loader)");
        await ensureSeedToken().catch((e)=>console.error("[lum] failed to seed enroll token:", e));
        if (process.env.LUM_DISABLE_CVE_SYNC !== "1") {
            const { startCveSyncLoop } = await __turbopack_context__.A("[project]/lib/cve-sync.ts [instrumentation] (ecmascript, async loader)");
            startCveSyncLoop();
        }
    }
}
}),
];

//# sourceMappingURL=instrumentation_ts_0zq9-xz._.js.map