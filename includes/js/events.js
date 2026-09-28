function bindClick(el, fn) { if (el) el.addEventListener('click', fn); }

bindClick(ui.exploitRunBtn, function () {
    if (user.blockJailbreak) return;
    user.blockJailbreak = true;
    chooseHEN();
    jailbreak();
});

bindClick(ui.psLogoContainer, function () {
    if (user.blockJailbreak) return;
    user.blockJailbreak = true;
    chooseHEN();
    jailbreak();
});


bindClick(ui.stopAutoJbBtn, function () {
    if (typeof stopAutoJailbreak === 'function') stopAutoJailbreak();
});


function aboutPopup() { alert('SlopBreak 3.1'); }
function settingsPopup() { if (typeof showPage === 'function') showPage('settings'); }
function themePopup() { if (typeof showPage === 'function') showPage('settings'); }
function chooseFanThreshold() {
    if (!ui.chooseFanThresholdOverlay) return;
    ui.chooseFanThresholdOverlay.classList.toggle('hidden');
}

function setAdvancedPayloads(inputState) {
    user.advancedPayloads = inputState ? 'true' : 'false';
    localStorage.setItem('advancedPayloads', user.advancedPayloads);
    var tab = ui.advancedPayloadsContainer;
    if (tab) {
        if (inputState) tab.classList.remove('hidden');
        else tab.classList.add('hidden');
    }
    if (!inputState && ui.advancedPayloadsSection && !ui.advancedPayloadsSection.classList.contains('hidden')) {
        if (typeof showPayloadTab === 'function') showPayloadTab('tools');
    }
    if (inputState && ui.advancedPayloadsSection && !ui.advancedPayloadsSection.children.length) {
        renderPayloads(payloadsList.filter(function (p) { return p.category === 'advanced'; }));
    }
}

function exploitChain(value) {
    localStorage.setItem('exploitChain', value);
    user.exploitChain = parseFloat(value);
    if (typeof updateFirmwareDashboard === 'function') updateFirmwareDashboard(window.ps4Fw || user.ps4Fw || '');
    if (typeof updateSpaStatus === 'function') updateSpaStatus();
}

function setBareboneJB(checked) {
    localStorage.setItem('bareboneJB', checked);
    user.bareboneJB = checked;
}

function clearStats() {
    if (!confirm((window.lang && window.lang.clearStatsConfirm) || 'Clear jailbreak statistics?')) return;
    localStorage.removeItem('jbTotal');
    localStorage.removeItem('jbSuccess');
    if (typeof updateJbStats === 'function') updateJbStats(false, false);
}

