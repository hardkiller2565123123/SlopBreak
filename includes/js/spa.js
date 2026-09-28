(function () {
    var currentPage = 'home';

    function byId(id) { return document.getElementById(id); }

    window.showPage = function (name) {
        var pages = document.querySelectorAll('[data-page-panel]');
        var nav = document.querySelectorAll('[data-page]');
        var i;
        for (i = 0; i < pages.length; i++) {
            if (pages[i].getAttribute('data-page-panel') === name) pages[i].classList.add('active');
            else pages[i].classList.remove('active');
        }
        for (i = 0; i < nav.length; i++) {
            if (nav[i].getAttribute('data-page') === name) nav[i].classList.add('active');
            else nav[i].classList.remove('active');
        }
        currentPage = name;
        if (name === 'linux') renderLinuxPage();
        if (name === 'tools') renderToolsPage();
        if (name === 'payloads' && typeof applyPayloadHubFilters === 'function') applyPayloadHubFilters();
        window.scrollTo(0, 0);
    };

    window.showPayloadTab = function (name) {
        var names = ['tools', 'advanced', 'linux'];
        var i;
        for (i = 0; i < names.length; i++) {
            var section = byId(names[i]);
            var tab = byId(names[i] + '-tab');
            if (section) {
                if (names[i] === name) section.classList.remove('hidden');
                else section.classList.add('hidden');
            }
            if (tab) {
                tab.setAttribute('aria-selected', names[i] === name ? 'true' : 'false');
                if (names[i] === name) tab.classList.add('active');
                else tab.classList.remove('active');
            }
        }
        if (typeof saveLastTab === 'function') saveLastTab(name);
        if (typeof applyPayloadHubFilters === 'function') applyPayloadHubFilters();
    };

    function findPayload(id) {
        if (typeof payloadsList === 'undefined') return null;
        for (var i = 0; i < payloadsList.length; i++) if (payloadsList[i].id === id) return payloadsList[i];
        return null;
    }

    function renderToolsPage() {
        var fw = window.ps4Fw || user.ps4Fw || '';
        var badge = byId('toolsFirmwareSummary');
        if (badge) badge.textContent = fw ? ('FW ' + fw) : 'FW --';
        var buttons = document.querySelectorAll('[data-tool-payload]');
        var compatible = 0;
        for (var i = 0; i < buttons.length; i++) {
            var p = findPayload(buttons[i].getAttribute('data-tool-payload'));
            var ok = p && (!fw || typeof payloadSupportsFirmware !== 'function' || payloadSupportsFirmware(p, fw));
            buttons[i].classList.toggle('not-compatible', !ok);
            buttons[i].disabled = !p;
            if (ok) compatible++;
        }
        var count = byId('toolsPayloadCount');
        if (count) count.textContent = compatible + ' ready for this firmware';
    }

    window.runLastPayload = function () {
        var list = [];
        try { list = JSON.parse(localStorage.getItem('wkPayloadHistory') || '[]'); } catch (e) {}
        if (!list.length) { alert('No recent payload.'); return; }
        var p = findPayload(list[0].id);
        if (!p) { alert('Payload is no longer available.'); return; }
        Loadpayloads(p.funcName, p.name, p.id);
    };

    function renderLinuxPage() {
        var target = byId('linuxQuickGrid');
        if (!target || target.getAttribute('data-rendered') === '1' || typeof payloadsList === 'undefined') return;
        target.innerHTML = '';
        var linuxPayloads = payloadsList.filter(function (p) { return p.category === 'linux'; });
        for (var i = 0; i < linuxPayloads.length; i++) {
            (function (p) {
                var card = document.createElement('article');
                card.className = 'payload-card';
                card.innerHTML = '<div class="payload-card-shell"><div class="payload-card-topline"><span class="payload-category-tag">LINUX</span><span class="payload-compat-indicator">' + (p.specificFW || 'GoldHEN') + '</span></div><div class="payload-card-copy"><h3>' + p.name + '</h3><p>' + p.description + '</p></div><div class="payload-card-launch-hint"><span>Launch</span><span>→</span></div></div>';
                card.onclick = function () { Loadpayloads(p.funcName, p.name, p.id); };
                target.appendChild(card);
            })(linuxPayloads[i]);
        }
        target.setAttribute('data-rendered', '1');
    }

    function getCachePage(fw) {
        var n = parseFloat(fw || 0);
        if (n >= 6.70 && n <= 6.72) return 'cache67x.html';
        if (n >= 7.00 && n <= 8.52) return 'cache7-8xx.html';
        if (n >= 9.00 && n <= 9.60) return 'cache9xx.html';
        if (n >= 10.00 && n <= 10.71) return 'cache10xx.html';
        if (n >= 11.00 && n <= 11.52) return 'cache11xx.html';
        if (n >= 12.00 && n <= 12.52) return 'cache12xx.html';
        if (n === 13.00) return 'cache1300.html';
        if (n >= 13.02 && n <= 13.52) return 'cache1302-1352.html';
        return 'cachePayloads.html';
    }

    function setCacheUi(percent, text, badge, cls) {
        var p = byId('inlineCacheProgress');
        var pct = byId('inlineCachePercent');
        var status = byId('inlineCacheStatus');
        var b = byId('cacheBadge');
        if (p && percent >= 0) p.style.width = percent + '%';
        if (pct && percent >= 0) pct.textContent = percent + '%';
        if (status) status.textContent = text;
        if (b) {
            b.textContent = badge;
            b.className = 'badge ' + (cls || 'neutral');
        }
    }

    window.startInlineCache = function () {
        var frame = byId('inlineCacheFrame');
        var fw = window.ps4Fw || user.ps4Fw || '';
        if (!frame) return;
        setCacheUi(0, 'Starting cache...', 'WORKING', 'warn');
        frame.src = 'about:blank';
        setTimeout(function () {
            frame.src = 'includes/caches/' + getCachePage(fw) + '?v=' + Date.now();
        }, 50);
    };

    window.addEventListener('message', function (event) {
        var data = event.data;
        if (!data || !data.type) return;
        if (data.type === 'CACHE_CHECKING') setCacheUi(5, 'Checking cache...', 'CHECKING', 'warn');
        else if (data.type === 'CACHE_DOWNLOADING') setCacheUi(10, 'Caching files...', 'DOWNLOADING', 'warn');
        else if (data.type === 'CACHE_PROGRESS') setCacheUi(data.percent >= 0 ? data.percent : 25, 'Caching files...', 'DOWNLOADING', 'warn');
        else if (data.type === 'CACHE_COMPLETE') setCacheUi(100, 'Cache installed', 'READY', 'good');
        else if (data.type === 'CACHE_EXISTS') setCacheUi(100, 'Cache is current', 'READY', 'good');
        else if (data.type === 'CACHE_ERROR') setCacheUi(0, 'Cache unavailable', 'ERROR', 'warn');
        updateSpaStatus();
        renderHomeQuickPayloads();
        if (user.platform === 'PS4') setTimeout(testLocalPayLoader, 500);
    }, false);

    window.testLocalPayLoader = function () {
        var status = byId('payloaderStatus');
        var top = byId('topPayLoader');
        if (user.platform !== 'PS4') { if (status) status.textContent = 'PS4 only'; if (top) top.textContent = 'PL --'; return; }
        if (status) status.textContent = 'Checking';
        if (top) top.textContent = 'PL ...';
        var req = new XMLHttpRequest();
        req.open('POST', 'http://127.0.0.1:9090/status', true);
        req.timeout = 2200;
        req.onload = function () {
            try {
                var json = JSON.parse(req.responseText || '{}');
                if (status) status.textContent = json.status === 'ready' ? 'Ready' : 'Responded';
                if (top) { top.textContent = json.status === 'ready' ? 'PL READY' : 'PL OK'; top.className = 'top-payloader ready'; }
            } catch (e) { if (status) status.textContent = 'Ready'; if (top) { top.textContent = 'PL READY'; top.className = 'top-payloader ready'; } }
        };
        req.onerror = req.ontimeout = function () { if (status) status.textContent = 'Not ready'; if (top) { top.textContent = 'PL OFF'; top.className = 'top-payloader'; } };
        req.send();
    };

    window.renderHomeQuickPayloads = function () {
        var target = byId('homeQuickPayloads');
        if (!target || typeof payloadsList === 'undefined') return;
        var favs = [], recent = [];
        try { favs = JSON.parse(localStorage.getItem('wkPayloadFavorites') || '[]'); } catch (e) {}
        try { recent = JSON.parse(localStorage.getItem('wkPayloadHistory') || '[]'); } catch (e) {}
        var ids = favs.slice(0, 3);
        for (var i = 0; i < recent.length && ids.length < 4; i++) if (ids.indexOf(recent[i].id) === -1) ids.push(recent[i].id);
        target.innerHTML = '';
        if (!ids.length) { target.innerHTML = '<span class="subtle">Favorite or launch a payload.</span>'; return; }
        for (var j = 0; j < ids.length; j++) {
            for (var k = 0; k < payloadsList.length; k++) if (payloadsList[k].id === ids[j]) {
                (function (payload) {
                    var b = document.createElement('button');
                    b.className = 'home-quick-payload';
                    b.type = 'button';
                    b.textContent = payload.name;
                    b.onclick = function () { Loadpayloads(payload.funcName, payload.name, payload.id); };
                    target.appendChild(b);
                })(payloadsList[k]);
                break;
            }
        }
    };

    function diagnosticsReport() {
        var fw = window.ps4Fw || user.ps4Fw || 'unknown';
        var profile = typeof getFirmwareProfile === 'function' ? getFirmwareProfile(fw) : null;
        return [
            'SlopBreak 3.1',
            'Firmware: ' + fw,
            'Chain: ' + (profile ? profile.chainName : 'unknown'),
            'HEN: ' + (user.currentJbFlavor || 'GoldHEN'),
            'GoldHEN: ' + (localStorage.getItem('GHVer') || 'GHv2.4b18.12'),
            'Network: ' + (navigator.onLine ? 'online' : 'offline'),
            'PayLoader: 127.0.0.1:9090'
        ].join('\n');
    }

    window.showDiagnostics = function () {
        var overlay = byId('diagnosticsOverlay');
        var text = byId('diagnosticsText');
        if (text) text.textContent = diagnosticsReport();
        if (overlay) overlay.classList.remove('hidden');
    };
    window.closeDiagnostics = function () { var overlay = byId('diagnosticsOverlay'); if (overlay) overlay.classList.add('hidden'); };

    window.setAutoFtpAfterJb = function (checked) { localStorage.setItem('autoFtpAfterJb', checked ? 'true' : 'false'); };

    window.resetSlopBreakSettings = function () {
        if (!confirm('Reset SlopBreak settings?')) return;
        var keys = ['language','jailbreakFlavor','lastTab','advancedPayloads','ps4Fw','exploitChain','autoJbRetry','autoStartJb','autoStartDelay','reloadAfterJb','GHVer','wkPayloadFavorites','wkPayloadHistory','wkPayloadView','autoFtpAfterJb'];
        for (var i = 0; i < keys.length; i++) localStorage.removeItem(keys[i]);
        sessionStorage.removeItem('autoJbRetry');
        sessionStorage.removeItem('autoStartSuppressed');
        user.currentLanguage = 'en';
        user.currentJbFlavor = 'GoldHEN';
        user.advancedPayloads = 'true';
        user.ps4Fw = window.ps4Fw || '';
        if (typeof loadJbFlavor === 'function') loadJbFlavor();
        if (typeof loadGoldHENVer === 'function') loadGoldHENVer();
        syncSpaUi();
        alert('Settings reset.');
    };

    window.updateSpaStatus = function () {
        var network = byId('topNetwork');
        if (network) network.className = 'status-dot ' + (navigator.onLine ? 'online' : 'offline');
        var fw = window.ps4Fw || user.ps4Fw || '';
        var tfw = byId('topFirmware');
        if (tfw) tfw.textContent = fw ? ('FW ' + fw) : 'FW --';
        var jf = byId('jailbreakFirmware');
        if (jf) jf.textContent = fw || '--';
        var chain = byId('jailbreakChain');
        if (chain && typeof getFirmwareProfile === 'function') chain.textContent = getFirmwareProfile(fw).chainName || 'Manual';
        var sfw = byId('settingsFirmware'); if (sfw) sfw.textContent = fw || '--';
        var footer = byId('footerMode');
        if (footer) footer.textContent = 'PS4 only';
    };

    window.syncSpaUi = function () {
        var advanced = byId('advancedPayloadsInput');
        if (advanced) advanced.checked = user.advancedPayloads === true || user.advancedPayloads === 'true';
        var autoFtp = byId('autoFtpAfterJb'); if (autoFtp) autoFtp.checked = localStorage.getItem('autoFtpAfterJb') === 'true';
        updateSpaStatus();
        renderLinuxPage();
        renderToolsPage();
        renderHomeQuickPayloads();
        if (typeof refreshPayloadHubProfile === 'function') refreshPayloadHubProfile();
    };

    function bind() {
        var pageButtons = document.querySelectorAll('[data-page]');
        for (var i = 0; i < pageButtons.length; i++) {
            pageButtons[i].addEventListener('click', function () { showPage(this.getAttribute('data-page')); });
        }
        var quick = document.querySelectorAll('[data-open-page]');
        for (var q = 0; q < quick.length; q++) {
            quick[q].addEventListener('click', function () {
                var page = this.getAttribute('data-open-page');
                showPage(page);
                var cat = this.getAttribute('data-category');
                if (cat) showPayloadTab(cat);
            });
        }
        var toolButtons = document.querySelectorAll('[data-tool-payload]');
        for (var tb = 0; tb < toolButtons.length; tb++) {
            toolButtons[tb].addEventListener('click', function () {
                var p = findPayload(this.getAttribute('data-tool-payload'));
                if (p) Loadpayloads(p.funcName, p.name, p.id);
            });
        }
        var payloadTabs = document.querySelectorAll('[data-payload-tab]');
        for (var t = 0; t < payloadTabs.length; t++) {
            payloadTabs[t].addEventListener('click', function () { showPayloadTab(this.getAttribute('data-payload-tab')); });
        }
        var cacheBtn = byId('updateCache');
        if (cacheBtn) cacheBtn.addEventListener('click', startInlineCache);
        window.addEventListener('online', updateSpaStatus);
        window.addEventListener('offline', updateSpaStatus);
        updateSpaStatus();
        renderHomeQuickPayloads();
        if (user.platform === 'PS4') setTimeout(testLocalPayLoader, 500);
    }

    document.addEventListener('keydown', function (e) {
        if (e.keyCode === 27) {
            if (typeof closePayloadDetails === 'function') closePayloadDetails();
            closeDiagnostics();
            var fan = byId('choose-fanThreshold-overlay');
            if (fan) fan.classList.add('hidden');
        }
    });

    document.addEventListener('DOMContentLoaded', bind);
})();
