function loadLastTab() {
    var tab = user.lastTab || 'tools';
    if (tab === 'custom') tab = 'tools';
    if (tab === 'advanced' && user.advancedPayloads !== true && user.advancedPayloads !== 'true') tab = 'tools';
    if (typeof showPayloadTab === 'function') showPayloadTab(tab);
}

function saveLastTab(tab) {
    user.lastTab = tab;
    localStorage.setItem('lastTab', tab);
}

async function Loadpayloads(payload, name, payloadId) {
    if (user.platform !== 'PS4') { alert('SlopBreak runs on PS4 only.'); return; }

    try {
        if (payloadId && typeof payloadSupportsFirmware === 'function') {
            var fw = typeof getPayloadHubFirmware === 'function' ? getPayloadHubFirmware() : (window.ps4Fw || user.ps4Fw);
            var item = null;
            for (var i = 0; i < payloadsList.length; i++) if (payloadsList[i].id === payloadId) { item = payloadsList[i]; break; }
            if (item && fw && !payloadSupportsFirmware(item, fw)) {
                if (!confirm('This payload is not listed for firmware ' + fw + '. Continue?')) return;
            }
        }

        if (payloadId && typeof recordPayloadLaunch === 'function') recordPayloadLaunch(payloadId, name || payloadId);
        sessionStorage.removeItem('binloader');
        if (payload === 'chooseFanThreshold') { chooseFanThreshold(); return; }

        var targetFunc = window[payload] || (window.payloads && window.payloads[payload]);
        if (typeof targetFunc !== 'function') {
            alert('Payload function not found: ' + payload);
            return;
        }
        targetFunc(name, payloadId);
    } catch (e) {
        alert('Payload failed: ' + e.message);
    }
}

function makePayloadCard(payload, index) {
    var card = document.createElement('article');
    card.id = payload.id;
    card.className = 'payload payload-card';
    card.dataset.payloadId = payload.id;
    card.dataset.payloadName = payload.name;
    card.dataset.payloadCategory = payload.category;
    card.dataset.payloadTags = (payload.tags || []).join(' ');
    card.dataset.payloadRisk = payload.risk || 'standard';
    card.dataset.originalIndex = String(index);
    card.dataset.payloadSearch = (payload.name + ' ' + payload.author + ' ' + payload.description + ' ' + (payload.specificFW || '') + ' ' + payload.category + ' ' + (payload.tags || []).join(' ') + ' ' + (payload.risk || '')).toLowerCase();
    card.onclick = function () { Loadpayloads(payload.funcName, payload.name, payload.id); };

    var fw = payload.specificFW || 'GoldHEN / payload dependent';
    card.innerHTML = '<div class="payload-card-shell">' +
        '<div class="payload-card-topline"><div><span class="payload-category-tag">' + payload.category + '</span> <span class="payload-risk ' + (payload.risk || 'standard') + '">' + (payload.risk || 'standard') + '</span></div>' +
        '<div class="payload-card-actions"><button type="button" class="payload-card-mini-button payload-favorite-button" onclick="event.stopPropagation();togglePayloadFavorite(\'' + payload.id + '\')">☆</button>' +
        '<button type="button" class="payload-card-mini-button" onclick="event.stopPropagation();openPayloadDetails(\'' + payload.id + '\')">···</button></div></div>' +
        '<div class="payload-card-copy"><h3>' + payload.name + '</h3><p class="payload-card-author">' + payload.author + '</p><p class="payload-card-description">' + payload.description + '</p></div>' +
        '<div class="payload-card-footer"><div class="payload-firmware-line"><span>FW</span><strong>' + fw + '</strong></div><span class="payload-compat-indicator">Check</span></div>' +
        '<div class="payload-card-launch-hint"><span>Launch</span><span>→</span></div></div>';
    return card;
}

function renderPayloads(payloads) {
    if (!payloads || !payloads.length) return;
    var categories = {};
    for (var i = 0; i < payloads.length; i++) categories[payloads[i].category] = true;
    if (payloads.length === payloadsList.length) categories = { tools:true, linux:true, advanced:true };

    if (categories.tools && ui.toolsSection) ui.toolsSection.innerHTML = '';
    if (categories.linux && ui.linuxSection) ui.linuxSection.innerHTML = '';
    if (categories.advanced && ui.advancedPayloadsSection) ui.advancedPayloadsSection.innerHTML = '';

    for (var p = 0; p < payloads.length; p++) {
        var payload = payloads[p];
        var card = makePayloadCard(payload, p);
        if (payload.category === 'tools' && ui.toolsSection) ui.toolsSection.appendChild(card);
        else if (payload.category === 'linux' && ui.linuxSection) ui.linuxSection.appendChild(card);
        else if (payload.category === 'advanced' && ui.advancedPayloadsSection) ui.advancedPayloadsSection.appendChild(card);
    }
    if (typeof applyPayloadHubFilters === 'function') applyPayloadHubFilters();
}

function filterPayloadCards(query) {
    if (typeof applyPayloadHubFilters === 'function') { applyPayloadHubFilters(query); return; }
    var q = String(query || '').toLowerCase().trim();
    var cards = document.querySelectorAll('.payload-card');
    var visible = 0;
    for (var i = 0; i < cards.length; i++) {
        var show = !q || (cards[i].dataset.payloadSearch || '').indexOf(q) !== -1;
        cards[i].style.display = show ? '' : 'none';
        if (show) visible++;
    }
    var count = document.getElementById('payloadSearchCount');
    if (count) count.textContent = q ? (visible + ' found') : 'All';
}

function loadAdvancedPayloads() {
    var enabled = user.advancedPayloads === true || user.advancedPayloads === 'true';
    if (ui.advancedPayloadsInput) ui.advancedPayloadsInput.checked = enabled;
    if (ui.advancedPayloadsContainer) {
        if (enabled) ui.advancedPayloadsContainer.classList.remove('hidden');
        else ui.advancedPayloadsContainer.classList.add('hidden');
    }
    if (enabled && ui.advancedPayloadsSection && !ui.advancedPayloadsSection.children.length) {
        renderPayloads(payloadsList.filter(function (p) { return p.category === 'advanced'; }));
    }
}

function getPayloadCategoryClass(category) { return 'category-' + category; }
