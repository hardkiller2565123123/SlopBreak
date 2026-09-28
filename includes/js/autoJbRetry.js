function setAutoJbRetry(checked) {
    localStorage.setItem('autoJbRetry', checked);
    sessionStorage.setItem('autoJbRetry', checked);

    if (!checked) return;
    if (confirm((window.lang && window.lang.autoJbRetryConfirm) || 'Start a jailbreak attempt now?')) jailbreak();
}

function setAutoStartJb(checked) {
    if (checked) {
        var ok = confirm('Auto-Start will launch the recommended supported jailbreak chain after the page loads. Enable it?');
        if (!ok) {
            var input = document.getElementById('autoStartJb');
            if (input) input.checked = false;
            checked = false;
        }
    }
    localStorage.setItem('autoStartJb', checked);
    if (checked) sessionStorage.removeItem('autoStartSuppressed');
}

function setAutoStartDelay(value) {
    var delay = parseInt(value, 10);
    if (delay !== 3 && delay !== 5 && delay !== 8) delay = 5;
    localStorage.setItem('autoStartDelay', delay);
}

function loadAutoStartSettings() {
    var enabled = localStorage.getItem('autoStartJb') === 'true';
    var delay = parseInt(localStorage.getItem('autoStartDelay') || '5', 10);
    var input = document.getElementById('autoStartJb');
    var select = document.getElementById('autoStartDelay');
    if (input) input.checked = enabled;
    if (select) select.value = String(delay);
    return { enabled: enabled, delay: delay };
}

function stopAutoJailbreak() {
    if (autoJbInterval) {
        clearInterval(autoJbInterval);
        autoJbInterval = null;
    }
    sessionStorage.setItem('autoJbRetry', 'false');
    sessionStorage.setItem('autoStartSuppressed', 'true');
    if (ui.stopAutoJbBtn) ui.stopAutoJbBtn.classList.add('hidden');
    if (ui.clickToStartText) {
        if (localStorage.getItem('theme') === 'compact') ui.clickToStartText.textContent = projectName;
        else ui.clickToStartText.textContent = (window.lang && window.lang.clickToStart) || 'Click to start';
    }
}

// When jailbreak succeeds, retry state is cleared by jailbreakSuccess().
function autoJailbreak() {
    var autoSettings = loadAutoStartSettings();

    // Used for 6.7x jailbreak when userland is loaded on jailbreak-only reload.
    if (sessionStorage.getItem('jailbreakNow') === 'true') {
        jailbreak();
        return;
    }

    var retryChecked = (localStorage.getItem('autoJbRetry') || 'true') === 'true';
    var sessionRetry = sessionStorage.getItem('autoJbRetry') === 'true';
    if (ui.autoJbRetry) ui.autoJbRetry.checked = retryChecked;

    var firmware = window.ps4Fw || (typeof user !== 'undefined' ? user.ps4Fw : '');
    var supported = typeof isFirmwareSupported === 'function'
        ? isFirmwareSupported(firmware)
        : (firmware >= webKitMin && firmware <= webKitMax);

    if (!supported || !firmware || user.platform !== 'PS4') return;

    if (retryChecked && sessionRetry) {
        autoJailbreakTimer(3, 'retry');
        return;
    }

    if (autoSettings.enabled && sessionStorage.getItem('autoStartSuppressed') !== 'true') {
        if (typeof applyRecommendedExploitChain === 'function') applyRecommendedExploitChain(firmware);
        autoJailbreakTimer(autoSettings.delay, 'start');
    }
}

function autoJailbreakTimer(seconds, mode) {
    var timer = parseInt(seconds || 3, 10);
    if (autoJbInterval) clearInterval(autoJbInterval);
    if (ui.stopAutoJbBtn) ui.stopAutoJbBtn.classList.remove('hidden');

    function renderTick() {
        if (ui.clickToStartText) {
            var prefix = mode === 'start' ? 'Auto-Start' : 'Auto-Retry';
            ui.clickToStartText.textContent = prefix + ' in ' + timer + 's — press Stop to cancel';
            ui.clickToStartText.style.fontSize = '15px';
        }
        if (timer <= 0) {
            clearInterval(autoJbInterval);
            autoJbInterval = null;
            sessionStorage.removeItem('autoStartSuppressed');
            jailbreak();
            return;
        }
        timer--;
    }

    renderTick();
    autoJbInterval = setInterval(renderTick, 1000);
}

function setReloadAfterJb(checked) {
    localStorage.setItem('reloadAfterJb', checked);
}

function getReloadAfterJb() {
    var checked = (localStorage.getItem('reloadAfterJb') || 'true') === 'true';
    var input = document.getElementById('reloadAfterJbInput');
    if (input) input.checked = checked;
    return checked;
}
