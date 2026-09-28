(function () {
    var FAV_KEY = 'wkPayloadFavorites';
    var HISTORY_KEY = 'wkPayloadHistory';
    var SORT_KEY = 'wkPayloadSort';
    var activeTag = 'all';
    var SOURCE_MAP = {
        FTP:'Scene-Collective/ps4-ftp', App2USB:'Scene-Collective/ps4-app2usb', AppDumper:'Scene-Collective/ps4-dumper',
        DisableUpdates:'Scene-Collective/ps4-disable-updates', EnableUpdates:'Scene-Collective/ps4-enable-updates', FanThreshold:'Scene-Collective/ps4-fan-threshold',
        HistoryBlocker:'Scene-Collective/ps4-history-blocker', KernelDumper:'Scene-Collective/ps4-kernel-dumper', RIFRenamer:'Scene-Collective/ps4-rif-renamer',
        PS4Debug:'CTN ps4debug', OrbisToolbox:'OSM-Made Orbis Toolbox', WebRTE:'WebRTE', NpFakeSignin:'earthonion np-fake-signin'
    };

    function readJson(key, fallback) {
        try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
    }
    function writeJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} }
    function favorites() { var v = readJson(FAV_KEY, []); return Array.isArray(v) ? v : []; }
    function history() { var v = readJson(HISTORY_KEY, []); return Array.isArray(v) ? v : []; }
    function firmware() { return String(window.ps4Fw || (typeof user !== 'undefined' && user.ps4Fw) || ''); }
    function fwNumber(value) { var n = parseFloat(String(value || '').replace(/[^0-9.]/g, '')); return isNaN(n) ? null : n; }

    function getPayload(id) {
        if (typeof payloadsList === 'undefined') return null;
        for (var i = 0; i < payloadsList.length; i++) if (payloadsList[i].id === id) return payloadsList[i];
        return null;
    }

    function supports(payload, fwValue) {
        if (!payload) return true;
        var rule = String(payload.specificFW || '').trim();
        if (!rule) return true;
        var fw = fwNumber(fwValue);
        if (fw === null) return true;
        var lower = rule.toLowerCase();
        var upTo = lower.match(/up\s+to\s+([0-9]+(?:\.[0-9]+)?)/i);
        if (upTo) return fw <= parseFloat(upTo[1]);
        var parts = rule.split(',');
        for (var i = 0; i < parts.length; i++) {
            var part = parts[i].trim();
            var range = part.match(/^([0-9]+(?:\.[0-9]+)?)\s*-\s*([0-9]+(?:\.[0-9]+)?)$/);
            if (range && fw >= parseFloat(range[1]) && fw <= parseFloat(range[2])) return true;
            var exact = fwNumber(part);
            if (!range && exact !== null && Math.abs(fw - exact) < .001) return true;
        }
        return false;
    }

    function lastUsed(id) {
        var list = history();
        for (var i = 0; i < list.length; i++) {
            if (list[i].id === id) {
                try { return new Date(list[i].at).toLocaleString(); } catch (e) { return 'Recently'; }
            }
        }
        return 'Never';
    }

    function recentRank(id) {
        var list = history();
        for (var i = 0; i < list.length; i++) if (list[i].id === id) return i;
        return 9999;
    }

    function activeContainer() {
        var ids = ['tools','advanced','linux'];
        for (var i = 0; i < ids.length; i++) {
            var el = document.getElementById(ids[i]);
            if (el && !el.classList.contains('hidden')) return el;
        }
        return null;
    }

    function applyFilters(queryOverride) {
        var search = document.getElementById('payloadSearch');
        var query = queryOverride !== undefined ? String(queryOverride || '') : (search ? search.value : '');
        query = query.toLowerCase().trim();
        var compatibleOnly = document.getElementById('hubCompatibleOnly');
        var favoritesOnly = document.getElementById('hubFavoritesOnly');
        var favs = favorites();
        var fw = firmware();
        var cards = document.querySelectorAll('.payload-card');
        var shown = 0;

        for (var i = 0; i < cards.length; i++) {
            var card = cards[i];
            var id = card.getAttribute('data-payload-id') || card.dataset.payloadId || '';
            var payload = getPayload(id);
            if (!payload) continue;
            var hay = String(card.getAttribute('data-payload-search') || card.dataset.payloadSearch || card.textContent || '').toLowerCase();
            var ok = supports(payload, fw);
            var tags = (payload.tags || []);
            var tagOk = activeTag === 'all' || tags.indexOf(activeTag) !== -1;
            var show = tagOk && (!query || hay.indexOf(query) !== -1) && (!compatibleOnly || !compatibleOnly.checked || ok) && (!favoritesOnly || !favoritesOnly.checked || favs.indexOf(id) !== -1);
            card.style.display = show ? '' : 'none';
            if (show) shown++;
            var indicator = card.querySelector('.payload-compat-indicator');
            if (indicator) {
                indicator.textContent = fw ? (ok ? 'Compatible' : 'Check FW') : 'FW varies';
                indicator.className = 'payload-compat-indicator ' + (ok ? 'compatible' : 'incompatible');
            }
            var favButton = card.querySelector('.payload-favorite-button');
            if (favButton) favButton.textContent = favs.indexOf(id) !== -1 ? '★' : '☆';
        }

        var container = activeContainer();
        var sort = document.getElementById('hubSortSelect');
        var sortMode = sort ? sort.value : (localStorage.getItem(SORT_KEY) || 'default');
        if (container) {
            var list = Array.prototype.slice.call(container.querySelectorAll('.payload-card'));
            list.sort(function (a,b) {
                var aid = a.dataset.payloadId || '', bid = b.dataset.payloadId || '';
                if (sortMode === 'name') return String(a.dataset.payloadName || '').localeCompare(String(b.dataset.payloadName || ''));
                if (sortMode === 'recent') return recentRank(aid) - recentRank(bid);
                return parseInt(a.dataset.originalIndex || '0',10) - parseInt(b.dataset.originalIndex || '0',10);
            });
            for (var j = 0; j < list.length; j++) container.appendChild(list[j]);
        }

        var count = document.getElementById('payloadSearchCount');
        if (count) count.textContent = (query || (compatibleOnly && compatibleOnly.checked) || (favoritesOnly && favoritesOnly.checked)) ? (shown + ' shown') : 'All';
    }

    window.payloadSupportsFirmware = supports;
    window.getPayloadHubFirmware = firmware;
    window.applyPayloadHubFilters = applyFilters;
    window.refreshPayloadHubProfile = function () { applyFilters(); };

    window.togglePayloadFavorite = function (id) {
        var list = favorites();
        var at = list.indexOf(id);
        if (at === -1) list.unshift(id); else list.splice(at, 1);
        writeJson(FAV_KEY, list);
        applyFilters();
        if (typeof renderHomeQuickPayloads === 'function') renderHomeQuickPayloads();
        var btn = document.getElementById('payloadDetailFavoriteButton');
        if (btn && btn.getAttribute('data-payload-id') === id) btn.textContent = list.indexOf(id) !== -1 ? '★ Favorited' : '☆ Favorite';
    };

    window.openPayloadDetails = function (id) {
        var p = getPayload(id);
        var overlay = document.getElementById('payloadDetailsOverlay');
        if (!p || !overlay) return;
        document.getElementById('payloadDetailName').textContent = p.name;
        document.getElementById('payloadDetailAuthor').innerHTML = p.author || '';
        var desc = document.getElementById('payloadDetailDescription');
        if (desc) desc.textContent = p.description || '';
        var fw = document.getElementById('payloadDetailFirmware');
        if (fw) fw.textContent = 'Firmware: ' + (p.specificFW || 'Payload dependent');
        var compat = document.getElementById('payloadDetailCompatibility');
        if (compat) compat.textContent = (p.risk ? (p.risk.toUpperCase() + ' • ') : '') + (supports(p, firmware()) ? 'Compatible' : 'Check firmware');
        var source = document.getElementById('payloadDetailSource');
        if (source) source.textContent = 'Source: ' + (SOURCE_MAP[id] || (String(id).indexOf('Linux') === 0 ? 'ps4-linux/ps4-linux-loader' : (p.author || 'Bundled'))).replace(/<br>/g, ' / ');
        var used = document.getElementById('payloadDetailLastUsed');
        if (used) used.textContent = 'Last used: ' + lastUsed(id);
        var fav = document.getElementById('payloadDetailFavoriteButton');
        if (fav) { fav.setAttribute('data-payload-id', id); fav.textContent = favorites().indexOf(id) !== -1 ? '★ Favorited' : '☆ Favorite'; }
        var launch = document.getElementById('payloadDetailLaunchButton');
        if (launch) launch.setAttribute('data-payload-id', id);
        overlay.classList.remove('hidden');
    };

    window.closePayloadDetails = function () {
        var overlay = document.getElementById('payloadDetailsOverlay');
        if (overlay) overlay.classList.add('hidden');
    };

    window.recordPayloadLaunch = function (id, name) {
        var old = history(), next = [{id:id,name:name || id,at:new Date().toISOString()}];
        for (var i = 0; i < old.length && next.length < 12; i++) if (old[i].id !== id) next.push(old[i]);
        writeJson(HISTORY_KEY, next);
        if (typeof renderHomeQuickPayloads === 'function') renderHomeQuickPayloads();
    };

    window.clearPayloadHistory = function () { writeJson(HISTORY_KEY, []); applyFilters(); if (typeof renderHomeQuickPayloads === 'function') renderHomeQuickPayloads(); };
    window.showFavoritePayloads = function () { var el=document.getElementById('hubFavoritesOnly'); if(el) el.checked=true; applyFilters(); };
    window.showRecentPayloads = function () { var el=document.getElementById('hubSortSelect'); if(el) el.value='recent'; localStorage.setItem(SORT_KEY,'recent'); applyFilters(); };
    window.showRecommendedPayloads = function () { var el=document.getElementById('hubCompatibleOnly'); if(el) el.checked=true; applyFilters(); };
    window.resetPayloadHubFilters = function () {
        var s=document.getElementById('payloadSearch'),c=document.getElementById('hubCompatibleOnly'),f=document.getElementById('hubFavoritesOnly'),o=document.getElementById('hubSortSelect');
        if(s)s.value=''; if(c)c.checked=false; if(f)f.checked=false; if(o)o.value='default'; activeTag='all'; var tags=document.querySelectorAll('[data-payload-tag]'); for(var i=0;i<tags.length;i++)tags[i].classList.toggle('active',tags[i].getAttribute('data-payload-tag')==='all'); localStorage.setItem(SORT_KEY,'default'); applyFilters('');
    };
    window.applyFirmwareProfileOverride = function () {};
    window.clearFirmwareProfileOverride = function () {};
    window.setPayloadView = function () {};

    function bind() {
        var search=document.getElementById('payloadSearch'); if(search) search.addEventListener('input',function(){applyFilters(search.value);});
        var c=document.getElementById('hubCompatibleOnly'); if(c)c.addEventListener('change',function(){applyFilters();});
        var f=document.getElementById('hubFavoritesOnly'); if(f)f.addEventListener('change',function(){applyFilters();});
        var s=document.getElementById('hubSortSelect'); if(s){s.value=localStorage.getItem(SORT_KEY)||'default';s.addEventListener('change',function(){localStorage.setItem(SORT_KEY,s.value);applyFilters();});}
        var tags=document.querySelectorAll('[data-payload-tag]'); for(var ti=0;ti<tags.length;ti++){tags[ti].addEventListener('click',function(){activeTag=this.getAttribute('data-payload-tag')||'all';for(var tj=0;tj<tags.length;tj++)tags[tj].classList.toggle('active',tags[tj]===this);applyFilters();});}
        var fav=document.getElementById('payloadDetailFavoriteButton'); if(fav)fav.addEventListener('click',function(){var id=fav.getAttribute('data-payload-id');if(id)togglePayloadFavorite(id);});
        var launch=document.getElementById('payloadDetailLaunchButton'); if(launch)launch.addEventListener('click',function(){var id=launch.getAttribute('data-payload-id'),p=getPayload(id);if(p){closePayloadDetails();Loadpayloads(p.funcName,p.name,p.id);}});
        var overlay=document.getElementById('payloadDetailsOverlay'); if(overlay)overlay.addEventListener('click',function(e){if(e.target===overlay)closePayloadDetails();});
        setTimeout(function(){applyFilters();},0);
    }
    document.addEventListener('DOMContentLoaded',bind);
})();
