/* Firmware-aware UI helpers. Exploit implementations remain in their original files. */
(function () {
    function toFirmwareCode(version) {
        if (version === null || version === undefined) return NaN;
        var text = String(version).trim();
        var match = text.match(/^(\d+)(?:\.(\d+))?$/);
        if (!match) return NaN;
        var major = parseInt(match[1], 10);
        var minorText = match[2] || "0";
        if (minorText.length === 1) minorText += "0";
        if (minorText.length > 2) minorText = minorText.substring(0, 2);
        return major * 100 + parseInt(minorText, 10);
    }

    var profiles = [
        { min: 670, max: 672, supported: true, chain: 2, chainName: "BadHoist + 6.7x", note: "Browser jailbreak is available for this firmware range." },
        { min: 700, max: 960, supported: true, chain: 1, chainName: "PSFree + Lapse", note: "PSFree/Lapse is the recommended SlopBreak route for this firmware range." },
        { min: 961, max: 1102, supported: true, chain: 4, chainName: "CSSFontFace + Lapse", note: "CSSFontFace/Lapse is the recommended SlopBreak route for this firmware range." },
        { min: 1103, max: 1202, supported: true, chain: 5, chainName: "SlopKit + Lapse", note: "SlopKit/Lapse is the recommended SlopBreak route for this firmware range." },
        { min: 1250, max: 1300, supported: true, chain: 6, chainName: "SlopKit + Netctrl", note: "SlopKit/Netctrl is the recommended SlopBreak route for this firmware range." },
        { min: 1302, max: 1352, supported: true, chain: 7, chainName: "SlopKit + Relapse", note: "Relapse covers the newer 13.02, 13.04, 13.50 and 13.52 browser-jailbreak range." }
    ];

    function getFirmwareProfile(version) {
        var code = toFirmwareCode(version);
        if (isNaN(code)) {
            return { supported: false, known: false, chain: null, chainName: "Unknown", note: "Firmware could not be detected." };
        }
        for (var i = 0; i < profiles.length; i++) {
            if (code >= profiles[i].min && code <= profiles[i].max) {
                var result = {};
                for (var key in profiles[i]) result[key] = profiles[i][key];
                result.known = true;
                result.code = code;
                return result;
            }
        }
        if (code >= 1400) {
            return {
                supported: false,
                known: true,
                chain: null,
                chainName: "No public chain in this host",
                note: "Firmware 14.00+ is not mapped in this build.",
                code: code
            };
        }
        return {
            supported: false,
            known: true,
            chain: null,
            chainName: "Unsupported gap",
            note: "This firmware is not mapped in this build.",
            code: code
        };
    }

    function isFirmwareSupported(version) {
        return getFirmwareProfile(version).supported === true;
    }

    function applyRecommendedExploitChain(version) {
        var profile = getFirmwareProfile(version || window.ps4Fw || (window.user && user.ps4Fw));
        if (!profile.supported || profile.chain === null) return false;
        if (typeof exploitChain === "function") exploitChain(profile.chain);
        if (typeof loadExploitChain === "function") loadExploitChain();
        return true;
    }

    function getSelectedHenLabel() {
        var flavor = (typeof user !== "undefined" && user.currentJbFlavor) ? user.currentJbFlavor : (localStorage.getItem("jailbreakFlavor") || "GoldHEN");
        if (flavor === "GoldHEN") {
            var version = localStorage.getItem("GHVer") || "GHv2.4b18.12";
            return "GoldHEN " + version.replace("GHv", "v");
        }
        return flavor;
    }

    function setText(id, value) {
        var el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    function updateFirmwareDashboard(version) {
        var firmware = version || window.ps4Fw || (typeof user !== "undefined" ? user.ps4Fw : "") || "--";
        var profile = getFirmwareProfile(firmware);
        var isPs4 = /PlayStation 4/i.test(navigator.userAgent);
        var badge = document.getElementById("smartSupportBadge");
        var startButton = document.getElementById("smartStartButton");

        setText("smartFirmware", firmware || "--");
        setText("smartChain", profile.chainName);
        setText("jailbreakChain", profile.chainName);
        setText("smartHen", getSelectedHenLabel());
        setText("smartHost", window.location.protocol.replace(":", "").toUpperCase() + " / " + (window.location.hostname || "local"));
        setText("smartNotice", profile.note);

        if (!isPs4) {
            if (startButton) startButton.disabled = true;
            return;
        }

        if (profile.supported) {
            setText("smartTitle", "Firmware " + firmware + " is mapped");
            setText("smartSubtitle", "Smart Start can select the recommended chain before launching.");
            if (badge) {
                badge.className = "smart-badge smart-badge-good";
                badge.textContent = "SUPPORTED";
            }
            if (startButton) startButton.disabled = !isPs4;
        } else {
            setText("smartTitle", "Firmware " + firmware + " is not supported");
            setText("smartSubtitle", "The host will not auto-start an unmapped exploit chain.");
            if (badge) {
                badge.className = "smart-badge smart-badge-warn";
                badge.textContent = "UNSUPPORTED";
            }
            if (startButton) startButton.disabled = true;
        }
    }

    window.toFirmwareCode = toFirmwareCode;
    window.getFirmwareProfile = getFirmwareProfile;
    window.isFirmwareSupported = isFirmwareSupported;
    window.applyRecommendedExploitChain = applyRecommendedExploitChain;
    window.updateFirmwareDashboard = updateFirmwareDashboard;
})();
