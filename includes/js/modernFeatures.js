/* UI-only quality-of-life features for the host. */
(function () {
    function getFirmwareForUi() {
        return window.ps4Fw || (typeof user !== "undefined" ? user.ps4Fw : "") || "";
    }

    window.startSmartJailbreak = function () {
        var firmware = getFirmwareForUi();
        var profile = typeof getFirmwareProfile === "function" ? getFirmwareProfile(firmware) : null;
        if (!profile || !profile.supported) {
            alert("This firmware does not have a mapped jailbreak chain in this build.");
            return;
        }
        if (typeof applyRecommendedExploitChain === "function") applyRecommendedExploitChain(firmware);
        if (typeof updateFirmwareDashboard === "function") updateFirmwareDashboard(firmware);
        if (typeof jailbreak === "function") jailbreak();
    };

    window.copyDiagnostics = function () { if (typeof showDiagnostics === 'function') showDiagnostics(); };

    function updateNetworkUi() {
        var dot = document.getElementById("smartNetworkDot");
        var text = document.getElementById("smartNetworkText");
        if (dot) dot.className = "smart-dot " + (navigator.onLine ? "smart-dot-online" : "smart-dot-offline");
        if (text) text.textContent = navigator.onLine ? "Network available" : "Offline mode";

        var cacheText = document.getElementById("smartCacheText");
        if (cacheText) {
            if (window.applicationCache) {
                var status = window.applicationCache.status;
                var names = ["uncached", "idle", "checking", "downloading", "updateready", "obsolete"];
                cacheText.textContent = "Cache: " + (names[status] || "ready");
            } else {
                cacheText.textContent = "Cache: browser managed";
            }
        }
    }

    function installPayloadSearch() {
        var input = document.getElementById("payloadSearch");
        if (!input || input.__slopbreakBound) return;
        input.__slopbreakBound = true;
        input.addEventListener("input", function () {
            if (typeof filterPayloadCards === "function") filterPayloadCards(input.value);
        });
    }

    function bootModernUi() {
        updateNetworkUi();
        installPayloadSearch();
        if (typeof updateFirmwareDashboard === "function") updateFirmwareDashboard(getFirmwareForUi());
    }

    window.addEventListener("online", updateNetworkUi);
    window.addEventListener("offline", updateNetworkUi);
    document.addEventListener("DOMContentLoaded", bootModernUi);
})();
