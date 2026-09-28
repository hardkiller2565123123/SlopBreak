function getPs4FwVersion(ua) {
    if (!ua) return '';
    var match = ua.match(/PlayStation 4[\/\s]+([\d.]+)/i);
    return match ? match[1] : '';
}

function setFwText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
}

function CheckFW() {
    var ua = navigator.userAgent || '';
    var isPs4 = /PlayStation 4/i.test(ua);
    if (!isPs4) {
        user.platform = 'BLOCKED';
        user.ip = '127.0.0.1';
        user.ps4Fw = '';
        window.ps4Fw = '';
        document.documentElement.className += ' non-ps4-client';
        return;
    }

    var fw = getPs4FwVersion(ua);
    user.platform = 'PS4';
    user.ip = '127.0.0.1';
    user.ps4Fw = fw;
    window.ps4Fw = fw;
    if (fw) localStorage.setItem('ps4Fw', fw);

    if (typeof firstTimeExploitChain === 'function') firstTimeExploitChain(fw);
    if (typeof updateExploitChainVisibility === 'function') updateExploitChainVisibility(fw);

    var supported = typeof isFirmwareSupported === 'function' ? isFirmwareSupported(fw) : (parseFloat(fw) >= webKitMin && parseFloat(fw) <= webKitMax);
    if (ui.ps4FwStatus) {
        ui.ps4FwStatus.textContent = supported ? ('Firmware ' + fw + ' supported') : ('Firmware ' + fw + ' not mapped');
        ui.ps4FwStatus.style.color = supported ? '#38d39f' : '#ffb84d';
    }

    setFwText('jailbreakFirmware', fw || '--');
    setFwText('settingsFirmware', fw || '--');
    setFwText('topFirmware', fw ? ('FW ' + fw) : 'FW --');

    if (typeof updateFirmwareDashboard === 'function') updateFirmwareDashboard(fw);
    if (typeof refreshPayloadHubProfile === 'function') refreshPayloadHubProfile();
    if (typeof applyPayloadHubFilters === 'function') applyPayloadHubFilters();
    if (typeof updateSpaStatus === 'function') updateSpaStatus();
}

function firstTimeExploitChain(fwVersion) {
    var current = localStorage.getItem('exploitChain');
    if (current !== null && !isNaN(parseFloat(current))) return;
    var fwNum = parseFloat(fwVersion);
    var chain = null;
    if (fwNum >= 6.70 && fwNum <= 6.72) chain = 2;
    else if (fwNum >= 7.00 && fwNum <= 9.60) chain = 1;
    else if (fwNum > 9.60 && fwNum <= 11.02) chain = 4;
    else if (fwNum > 11.02 && fwNum <= 12.02) chain = 5;
    else if (fwNum >= 12.50 && fwNum <= 13.00) chain = 6;
    else if (fwNum >= 13.02 && fwNum <= 13.52) chain = 7;
    if (chain !== null && typeof exploitChain === 'function') exploitChain(chain);
}

function toggleVisibility(id, show) {
    var el = document.getElementById(id);
    if (!el) return;
    if (show) el.classList.remove('hidden');
    else el.classList.add('hidden');
}

function updateExploitChainVisibility(fwVersion) {
    var fwNum = parseFloat(fwVersion);
    if (isNaN(fwNum)) return;
    toggleVisibility('badHoistExp', fwNum >= 6.70 && fwNum <= 6.72);
    toggleVisibility('modularLapseExp', fwNum >= 7.00 && fwNum <= 9.60);
    toggleVisibility('bundleLapseExp', fwNum >= 7.00 && fwNum <= 9.60);
    toggleVisibility('cssFontFaceNetCtrlExp', fwNum >= 9.00 && fwNum <= 11.02);
    toggleVisibility('cssFontFaceLapseExp', fwNum >= 9.00 && fwNum <= 11.02);
    toggleVisibility('slopKitLapseExp', fwNum >= 11.00 && fwNum <= 12.02);
    toggleVisibility('slopKitNetCtrlExp', fwNum >= 12.50 && fwNum <= 13.00);
    toggleVisibility('relapseExp', fwNum >= 13.02 && fwNum <= 13.52);
}
