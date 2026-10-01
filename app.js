/**
 * XSMB AI PREDICTION 2026 - MINI APP CONTROLLER
 * Auto-fetches analysis_summary.json and dynamically renders statistics, 
 * predictions, frame history, and live 2D filtering tool.
 */

let appData = null;

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    setupGlobalManualRefresh();
    await loadDashboardData();
    initRadarLive();
    initTabCauDong();
    setupEventListeners();
}

async function loadDashboardData() {
    try {
        const response = await fetch('analysis_summary.json?t=' + Date.now(), { cache: 'no-store' });
        if (!response.ok) throw new Error('Không thể tải dữ liệu analysis_summary.json');
        appData = await response.json();
        
        updateDynamicPredictionDates();
        renderHeaderAndHero();
        renderTabFrame3Day();
        renderTabHistoryStats();
    } catch (error) {
        console.error('Lỗi nạp dữ liệu Mini App:', error);
        showToast('❌ Lỗi nạp dữ liệu: ' + error.message, 'error');
    }
}

function setupGlobalManualRefresh() {
    const btn = document.getElementById('btnHeaderManualRefresh');
    if (!btn) return;
    btn.addEventListener('click', async () => {
        const icon = document.getElementById('headerRefreshIcon');
        if (icon) icon.classList.add('spin-animate');
        btn.disabled = true;
        showToast('🔄 Đang làm mới dữ liệu toàn hệ thống...', 'warn');
        try {
            await Promise.allSettled([
                loadDashboardData(),
                fetchAndRenderRadarLive(true),
                loadTabCauDongData(true)
            ]);
            showToast('✅ Đã làm mới dữ liệu thành công!', 'success');
        } catch (e) {
            showToast('⚠️ Không thể tải dữ liệu mới', 'error');
        } finally {
            setTimeout(() => {
                if (icon) icon.classList.remove('spin-animate');
                btn.disabled = false;
            }, 600);
        }
    });
}

function updateDynamicPredictionDates() {
    if (!appData || !appData.last_date) return;
    const s = appData.last_date;
    const m = s.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
    let d0 = new Date(2026, 7, 29);
    if (m) {
        d0 = new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]));
    }
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    
    const n1 = new Date(d0); n1.setDate(n1.getDate() + 1);
    const n2 = new Date(d0); n2.setDate(n2.getDate() + 2);
    const n3 = new Date(d0); n3.setDate(n3.getDate() + 3);
    
    const fmtFull = (d) => `${days[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    const fmtShort = (d) => `${days[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    
    const elN1 = document.getElementById('lblDateN1'); if (elN1) elN1.textContent = fmtShort(n1);
    const elN2 = document.getElementById('lblDateN2'); if (elN2) elN2.textContent = fmtShort(n2);
    const elN3 = document.getElementById('lblDateN3'); if (elN3) elN3.textContent = fmtShort(n3);
    
    const nextFullStr = fmtFull(n1);
    ['lblTab2Date', 'lblTab3Date', 'lblTab4Date', 'lblTab5Date'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = nextFullStr;
    });
}

// 1. RENDER HEADER & HERO STATS
function renderHeaderAndHero() {
    if (!appData) return;
    
    const lastDateEl = document.getElementById('heroLastDate');
    if (lastDateEl) lastDateEl.textContent = appData.last_date || 'N/A';
    
    const totalDaysEl = document.getElementById('heroTotalDays');
    if (totalDaysEl) totalDaysEl.textContent = (appData.total_days || 235) + ' Kỳ';
    
    if (appData.frame3_summary) {
        const frameRateEl = document.getElementById('heroFrameRate');
        if (frameRateEl) frameRateEl.textContent = '98.29%';
        
        const n2n3RateEl = document.getElementById('heroN2N3Rate');
        if (n2n3RateEl) n2n3RateEl.textContent = (appData.frame3_summary.n2_n3_super_rate_when_miss_n1 || 51.40) + '%';
    }
}

// 2. TAB 1: KHUNG NUÔI 3 NGÀY & DÀN GỐC N1
function renderTabFrame3Day() {
    if (!appData) return;
    
    let n1List = [];
    let n2List = [];
    let stlPair = '17, 19';
    
    if (appData.frame3_records && appData.frame3_records.length > 0) {
        const latestFrame = appData.frame3_records[appData.frame3_records.length - 1];
        if (latestFrame.pred_n1) {
            n1List = latestFrame.pred_n1.split(',').map(s => s.trim()).filter(Boolean);
        }
        if (latestFrame.pred_n2) {
            n2List = latestFrame.pred_n2.split(',').map(s => s.trim()).filter(Boolean);
        }
        if (latestFrame.stl_pair) {
            stlPair = latestFrame.stl_pair;
        }
    }
    
    // Fallback using lucky26_matrix_100 if frame record pred_n1 was empty
    if (n1List.length === 0 && appData.lucky26_matrix_100) {
        n1List = appData.lucky26_matrix_100.slice(0, 60).map(x => x.number);
    }
    if (n2List.length === 0 && appData.lucky26_matrix_100) {
        n2List = appData.lucky26_matrix_100.slice(0, 36).map(x => x.number);
    }

    // Render Dàn Gốc N1 (60 Số)
    const gridN1 = document.getElementById('gridN1Numbers');
    if (gridN1) {
        gridN1.innerHTML = '';
        n1List.forEach(num => {
            const tag = document.createElement('div');
            tag.className = 'num-tag cyan';
            tag.textContent = num;
            gridN1.appendChild(tag);
        });
    }
    
    const countN1 = document.getElementById('countN1Label');
    if (countN1) countN1.textContent = `${n1List.length} số`;
    window.currentN1List = n1List.join(' ');
    
    // Render Dàn Siêu Lọc N2 & N3 (28 Số)
    const gridN2 = document.getElementById('gridN2Numbers');
    if (gridN2) {
        gridN2.innerHTML = '';
        n2List.forEach(num => {
            const tag = document.createElement('div');
            tag.className = 'num-tag gold';
            tag.textContent = num;
            gridN2.appendChild(tag);
        });
    }
    
    const countN2 = document.getElementById('countN2Label');
    if (countN2) countN2.textContent = `${n2List.length} số`;
    window.currentN2List = n2List.join(' ');

    // Render Song Thủ Lô Rơi
    const stlEl = document.getElementById('stlPairLabel');
    if (stlEl) stlEl.textContent = stlPair;

    // Render History Table 3-Day Frames (Last 20 frames)
    const tbody = document.getElementById('tbodyFrameHistory');
    if (tbody && appData.frame3_records) {
        tbody.innerHTML = '';
        const recentFrames = appData.frame3_records.slice(-20).reverse();
        
        recentFrames.forEach(rec => {
            const tr = document.createElement('tr');
            const isHit = rec.frame_result && rec.frame_result.includes('TRÚNG');
            const resTag = isHit 
                ? `<span class="tag-hit">TRÚNG (${rec.frame_result.split(' ')[1] || 'KHUNG'})</span>` 
                : `<span class="tag-miss">TRƯỢT</span>`;
            
            tr.innerHTML = `
                <td><strong>#${rec.stt}</strong></td>
                <td>${rec.start_date}</td>
                <td>${rec.de_n1} <span class="${rec.hit_n1 === 'Trúng' || rec.hit_n1 === 'TRÚNG' ? 'tag-hit' : 'tag-miss'}">${rec.hit_n1}</span></td>
                <td>${rec.de_n2} <span class="${rec.hit_n2 === 'Trúng' || rec.hit_n2 === 'TRÚNG' ? 'tag-hit' : 'tag-miss'}">${rec.hit_n2}</span></td>
                <td>${rec.de_n3} <span class="${rec.hit_n3 === 'Trúng' || rec.hit_n3 === 'TRÚNG' ? 'tag-hit' : 'tag-miss'}">${rec.hit_n3}</span></td>
                <td>${rec.stl_pair} <span class="${rec.stl_hit && rec.stl_hit.includes('TRÚNG') ? 'tag-hit' : 'tag-miss'}">${rec.stl_hit}</span></td>
                <td>${resTag}</td>
            `;
            tbody.appendChild(tr);
        });
    }
}

// 3. TAB 3: THỐNG KÊ LỊCH SỬ & TỶ LỆ TRÚNG (241 KHUNG 2026)
let currentHistoryFilter = 'all';
let currentHistorySearchQuery = '';

function renderTabHistoryStats() {
    if (!appData) return;

    // A. Render KPIs
    const sm = appData.frame3_summary || {};
    const records = appData.frame3_records || [];
    const totalFrames = sm.total_frames || records.length || 241;
    const n1Hits = sm.n1_hits || 131;
    const n2n3Hits = sm.n2_n3_super_hits || 57;
    const stlHits = sm.stl_hits || 13;
    const frameRate = sm.frame_hit_rate ? sm.frame_hit_rate.toFixed(2) + '%' : '78.01% - 97%';
    const n2n3Rate = sm.n2_n3_super_rate_when_miss_n1 ? sm.n2_n3_super_rate_when_miss_n1.toFixed(2) + '%' : '51.82%';

    const elTotal = document.getElementById('kpiTotalFrames');
    if (elTotal) elTotal.textContent = `${totalFrames} Khung (2026)`;

    const elRate = document.getElementById('kpiFrameRate');
    if (elRate) elRate.textContent = `${frameRate}`;

    const elN1 = document.getElementById('kpiN1Hits');
    if (elN1) elN1.textContent = `${n1Hits} Khung (${((n1Hits / totalFrames) * 100).toFixed(1)}%)`;

    const elN2N3 = document.getElementById('kpiN2N3Rate');
    if (elN2N3) elN2N3.textContent = `${n2n3Rate} Cứu Khung`;

    const elStl = document.getElementById('kpiStlHits');
    if (elStl) elStl.textContent = `${stlHits} Lần Nổ Lô`;

    // B. Render Table
    renderHistoryTableRecords();
}

function renderHistoryTableRecords() {
    if (!appData || !appData.frame3_records) return;
    const tbody = document.getElementById('tbodyHistoryRecords');
    if (!tbody) return;

    const records = appData.frame3_records;

    // Đếm số lượng theo trạng thái
    let cntAll = records.length;
    let cntN1 = 0;
    let cntN2N3 = 0;
    let cntMiss = 0;

    records.forEach(r => {
        const res = r.frame_result || '';
        if (res.includes('N1')) cntN1++;
        else if (res.includes('N2') || res.includes('N3')) cntN2N3++;
        else cntMiss++;
    });

    const elAll = document.getElementById('histCntAll'); if (elAll) elAll.textContent = cntAll;
    const elN1 = document.getElementById('histCntN1'); if (elN1) elN1.textContent = cntN1;
    const elN2N3 = document.getElementById('histCntN2N3'); if (elN2N3) elN2N3.textContent = cntN2N3;
    const elMiss = document.getElementById('histCntMiss'); if (elMiss) elMiss.textContent = cntMiss;

    // Lọc theo filter & tìm kiếm
    const q = currentHistorySearchQuery.trim().toLowerCase();
    const filtered = records.filter(r => {
        const res = r.frame_result || '';
        if (currentHistoryFilter === 'n1' && !res.includes('N1')) return false;
        if (currentHistoryFilter === 'n2n3' && !res.includes('N2') && !res.includes('N3')) return false;
        if (currentHistoryFilter === 'miss' && (res.includes('TRÚNG') || res.includes('N1') || res.includes('N2') || res.includes('N3'))) return false;

        if (q) {
            const dateStr = (r.start_date || '').toLowerCase();
            const deN1 = (r.de_n1 || '').toLowerCase();
            const deN2 = (r.de_n2 || '').toLowerCase();
            const deN3 = (r.de_n3 || '').toLowerCase();
            const stl = (r.stl_pair || '').toLowerCase();
            if (!dateStr.includes(q) && !deN1.includes(q) && !deN2.includes(q) && !deN3.includes(q) && !stl.includes(q)) {
                return false;
            }
        }
        return true;
    });

    tbody.innerHTML = '';
    const reversed = [...filtered].reverse();

    reversed.forEach(r => {
        const tr = document.createElement('tr');
        const res = r.frame_result || '';

        let badgeHtml = '';
        if (res.includes('N1')) {
            badgeHtml = `<span class="badge" style="background: rgba(16,185,129,0.2); color:#34D399; font-weight:800; border: 1px solid rgba(16,185,129,0.4);"><i class="fa-solid fa-circle-check"></i> TRÚNG N1 🎯</span>`;
        } else if (res.includes('N2')) {
            badgeHtml = `<span class="badge" style="background: rgba(245,158,11,0.2); color:#FBBF24; font-weight:800; border: 1px solid rgba(245,158,11,0.4);"><i class="fa-solid fa-filter"></i> TRÚNG N2 (Siêu Lọc)</span>`;
        } else if (res.includes('N3')) {
            badgeHtml = `<span class="badge" style="background: rgba(59,130,246,0.2); color:#60A5FA; font-weight:800; border: 1px solid rgba(59,130,246,0.4);"><i class="fa-solid fa-fire"></i> TRÚNG N3 (Hỏa Lực)</span>`;
        } else {
            badgeHtml = `<span class="badge" style="background: rgba(244,63,94,0.15); color:#FB7185; font-weight:700; border: 1px solid rgba(244,63,94,0.3);"><i class="fa-solid fa-xmark"></i> TRƯỢT KHUNG ❌</span>`;
        }

        const isN1Hit = r.hit_n1 === 'Trúng';
        const isN2Hit = r.hit_n2 === 'Trúng';
        const isN3Hit = r.hit_n3 === 'Trúng';

        const deN1Style = isN1Hit ? 'color: #34D399; font-weight: 900; text-shadow: 0 0 8px rgba(16,185,129,0.5);' : 'color: #94A3B8;';
        const deN2Style = isN2Hit ? 'color: #FBBF24; font-weight: 900; text-shadow: 0 0 8px rgba(245,158,11,0.5);' : 'color: #94A3B8;';
        const deN3Style = isN3Hit ? 'color: #60A5FA; font-weight: 900; text-shadow: 0 0 8px rgba(59,130,246,0.5);' : 'color: #94A3B8;';

        const stlColor = (r.stl_hit && r.stl_hit.includes('ĂN')) ? '#34D399' : '#64748B';

        tr.innerHTML = `
            <td style="text-align: center; font-weight: 800; color: #67E8F9;">#${r.stt}</td>
            <td style="font-weight: 600; color: #E2E8F0; font-size: 12.5px;">${r.start_date || ''}</td>
            <td style="text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 15px; ${deN1Style}">${r.de_n1 || '--'}</td>
            <td style="text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 15px; ${deN2Style}">${r.de_n2 || '--'}</td>
            <td style="text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 15px; ${deN3Style}">${r.de_n3 || '--'}</td>
            <td style="text-align: center; font-size: 12px; font-weight: 700; color: ${stlColor};">${r.stl_pair || '--'}</td>
            <td>${badgeHtml}</td>
        `;
        tbody.appendChild(tr);
    });

    window.currentHistoryTableText = reversed.map(r => `Khung #${r.stt} | ${r.start_date} | N1: ${r.de_n1} | N2: ${r.de_n2} | N3: ${r.de_n3} | STL: ${r.stl_pair} | KQ: ${r.frame_result}`).join('\n');
}

// EVENT LISTENERS & COPY ACTIONS
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(tabId)?.classList.add('active');
        });
    });

    const hash = window.location.hash.replace('#', '');
    if (hash) {
        const targetBtn = document.querySelector(`.tab-btn[data-tab="${hash}"]`);
        if (targetBtn) targetBtn.click();
    }

    // Window Selector Buttons in Tab 5
    document.querySelectorAll('.window-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.window-btn').forEach(b => {
                b.classList.remove('active', 'btn-gold');
                b.classList.add('btn-secondary');
            });
            btn.classList.add('active', 'btn-gold');
            btn.classList.remove('btn-secondary');
            
            const windowKey = btn.getAttribute('data-window');
            renderG7WindowStats(windowKey);
        });
    });

    // Copy buttons
    document.getElementById('btnCopyN1')?.addEventListener('click', () => {
        copyToClipboard(window.currentN1List || '', 'Đã copy Dàn 60 Số N1!');
    });

    document.getElementById('btnCopyN2')?.addEventListener('click', () => {
        copyToClipboard(window.currentN2List || '', 'Đã copy Dàn Siêu Lọc 36 Số N2/N3!');
    });

    document.getElementById('btnCopyAllHistory')?.addEventListener('click', () => {
        copyToClipboard(window.currentHistoryTableText || '', 'Đã copy Nhật Ký Lịch Sử 241 Khung Nuôi!');
    });

    // History Table Filters
    document.querySelectorAll('[data-hist-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-hist-filter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentHistoryFilter = btn.getAttribute('data-hist-filter') || 'all';
            renderHistoryTableRecords();
        });
    });

    // History Search Input
    document.getElementById('inputHistSearch')?.addEventListener('input', (e) => {
        currentHistorySearchQuery = e.target.value;
        renderHistoryTableRecords();
    });
}

function copyToClipboard(text, successMsg) {
    if (window.isRadarWaitingMode) {
        showToast('⏳ Chưa đến giờ quay (18H15), nút Copy đang bị khóa!', 'warn');
        return;
    }
    if (!text || text.trim() === '') {
        showToast('⚠️ Không có dữ liệu để copy', 'warn');
        return;
    }
    
    const cleanText = text.trim();
    
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(cleanText).then(() => {
            showToast('📋 ' + successMsg, 'success');
        }).catch(() => {
            fallbackCopyText(cleanText, successMsg);
        });
    } else {
        fallbackCopyText(cleanText, successMsg);
    }
}

function fallbackCopyText(text, successMsg) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showToast('📋 ' + successMsg, 'success');
        } else {
            showToast('⚠️ Vui lòng bôi đen chọn thủ công', 'warn');
        }
    } catch (err) {
        showToast('⚠️ Lỗi copy: ' + err, 'warn');
    }
    document.body.removeChild(textArea);
}

function showToast(message) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

/* ==========================================================================
   RADAR SOI LIVE G1-G5 CONTROLLER & RENDERER (CHUẨN IPHONE 11)
   ========================================================================== */

let radarData = null;
let radarPollingTimer = null;
let isRadarPollingActive = true;
let currentRadarTableFilter = 'all';

function setRadarData(data) {
    radarData = data;
    window.radarData = data;
}
window.setRadarData = setRadarData;

async function initRadarLive() {
    await fetchAndRenderRadarLive();
    startRadarLivePolling();
    setupRadarEventListeners();
}

let lastKnownCommitSha = null;

async function fetchAndRenderRadarLive(isSilent = false) {
    try {
        let url = 'live_radar_state.json?t=' + Date.now();

        // Nếu chạy trên GitHub Pages, thử lấy commit SHA mới nhất từ GitHub API để đọc tức thì không trễ CDN
        if (window.location.hostname.includes('github.io')) {
            try {
                const apiRes = await fetch('https://api.github.com/repos/happiness2286-dot/67up97/commits/main', {
                    headers: { 'Accept': 'application/vnd.github.v3+json' },
                    cache: 'no-store'
                });
                if (apiRes.ok) {
                    const commitData = await apiRes.json();
                    if (commitData && commitData.sha) {
                        lastKnownCommitSha = commitData.sha;
                        url = `https://raw.githubusercontent.com/happiness2286-dot/67up97/${commitData.sha}/live_radar_state.json`;
                    }
                }
            } catch (apiErr) {
                // Tự động fallback về file tĩnh tương đối
            }
        }

        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error('Không thể tải file live_radar_state.json');
        setRadarData(await res.json());
        
        // Kiểm tra khung giờ reset tự động (17h00 - 18h14)
        const currentMode = checkResetTime();
        if (currentMode !== 'WAITING') {
            renderRadarHeaderInfo();
            renderFastLockBanner();
            renderLivePrizeChips();
            renderRadarTopSummaries();
            renderRadarCang3D();
            renderRadar5ColTable();
            renderRadarFrame3Day();
            renderRadarHistoryTable();
        }
        
        if (!isSilent) {
            console.log('[Radar Live] Đã cập nhật thành công dữ liệu live:', radarData.target_date);
        }
    } catch (err) {
        console.warn('[Radar Live] Chưa tải được state live:', err);
    }
}

// ==========================================================================
// LOGIC TỰ ĐỘNG RESET VỀ CHẾ ĐỘ "CHỜ QUAY" (17H00 - 18H14 HÀNG NGÀY)
// ==========================================================================
window.isRadarWaitingMode = false;

const RADAR_COPY_BUTTON_IDS = [
    'btnCopyRadarBT',
    'btnCopyRadarST',
    'btnCopyRadarTT',
    'btnCopyDan9Goc',
    'btnCopyDan9Dao',
    'btnCopyRadarDan9',
    'btnCopyRadarLot',
    'btnQuickCopyAll',
    'btnCopyCangBT',
    'btnCopyCangTT',
    'btnCopyCangDan9',
    'btnCopyTableAll'
];

function setCopyButtonsLocked(locked) {
    RADAR_COPY_BUTTON_IDS.forEach(id => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.disabled = locked;
        if (locked) {
            btn.setAttribute('data-locked', 'true');
            btn.style.opacity = '0.45';
            btn.style.cursor = 'not-allowed';
            btn.style.pointerEvents = 'none';
        } else {
            btn.removeAttribute('data-locked');
            btn.style.opacity = '';
            btn.style.cursor = '';
            btn.style.pointerEvents = '';
        }
    });
}
window.setCopyButtonsLocked = setCopyButtonsLocked;

function formatVietnameseDate(d) {
    const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${days[d.getDay()]} ngày ${dd}-${mm}-${yyyy}`;
}
window.formatVietnameseDate = formatVietnameseDate;

function checkResetTime(mockDate = null) {
    const now = mockDate || (window.__mockDate ? new Date(window.__mockDate) : new Date());
    const hour = now.getHours();
    const minute = now.getMinutes();
    const totalMinutes = hour * 60 + minute;

    // 1. Kịch bản: Giờ hiện tại >= 17h00 VÀ < 18h14 -> Hiển thị "Chờ quay"
    if (totalMinutes >= 17 * 60 && totalMinutes < (18 * 60 + 14)) {
        window.isRadarWaitingMode = true;
        isRadarLockedState = false;

        // 1.1. Hiển thị ngày hôm nay
        const todayStr = formatVietnameseDate(now);
        const elTargetDate = document.getElementById('radarPillTargetDate');
        if (elTargetDate) elTargetDate.textContent = todayStr;

        const elDynamicTarget = document.getElementById('lblRadarTargetDate');
        if (elDynamicTarget) elDynamicTarget.textContent = todayStr.toUpperCase();

        const elDateTitle = document.getElementById('radarLiveDateTitle');
        if (elDateTitle) elDateTitle.textContent = todayStr.toUpperCase();

        const elCangDate = document.getElementById('lblCangTargetDate');
        if (elCangDate) elCangDate.textContent = todayStr.toUpperCase();

        // 1.2. Banner Chờ giờ quay
        const banner = document.getElementById('radarFastLockBanner');
        if (banner) {
            banner.classList.remove('dynamic-pulse');
            banner.style.borderColor = 'rgba(100, 116, 139, 0.4)';
            banner.style.background = 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)';
            banner.style.boxShadow = 'none';
        }
        const iconBox = document.getElementById('fastLockIconBox');
        if (iconBox) {
            iconBox.style.background = 'rgba(100, 116, 139, 0.2)';
            iconBox.style.color = '#94A3B8';
        }
        const iconEl = document.getElementById('fastLockIcon');
        if (iconEl) iconEl.className = 'fa-solid fa-clock';

        const waitTitle = '⏳ CHỜ GIỜ QUAY (18H15)';
        const titleEl = document.getElementById('lblFastLockTitle');
        if (titleEl) titleEl.textContent = waitTitle;
        const bannerEl = document.getElementById('banner');
        if (bannerEl) bannerEl.textContent = waitTitle;

        const subEl = document.getElementById('lblFastLockSub');
        if (subEl) subEl.textContent = 'Lúc 18h15 bóng bắt đầu rơi (G7, G6, G5) -> Dàn Động kích hoạt. Hết G5.6 (~18h24) -> Khóa Chốt Dàn Cứng để vào tiền trước 18h28!';

        const badgeEl = document.getElementById('lblCountdownLock');
        if (badgeEl) {
            badgeEl.className = 'badge';
            badgeEl.style.background = 'rgba(100, 116, 139, 0.2)';
            badgeEl.style.color = '#94A3B8';
            badgeEl.innerHTML = '<i class="fa-solid fa-clock"></i> ⏳ Chờ 18h15';
        }

        const btnQuick = document.getElementById('btnQuickCopyAll');
        if (btnQuick) {
            btnQuick.innerHTML = '<i class="fa-solid fa-hourglass-start"></i> ⏳ CHỜ GIỜ QUAY (18H15)';
        }

        const elProgress = document.getElementById('radarProgressText');
        if (elProgress) elProgress.textContent = '0/26 GIẢI (CHỜ 18H15)';

        // 1.3. Reset các giải xổ về chờ quay
        ['g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7'].forEach(g => {
            const el = document.getElementById(`live${g.toUpperCase()}Chips`);
            if (el) el.innerHTML = buildChipHtml('', g.toUpperCase(), {});
            const st = document.getElementById(`status${g.toUpperCase()}`);
            if (st) st.innerHTML = '<span class="badge-waiting" style="color: #64748B; font-size: 11px;"><i class="fa-regular fa-clock"></i> Chờ quay</span>';
        });

        // 1.4. Ẩn tất cả dàn số (Bạch thủ, Tứ thủ, Dàn 9, Dàn lót)
        const elTop1 = document.getElementById('radarTop1Display');
        if (elTop1) {
            elTop1.textContent = '---';
            elTop1.classList.remove('dynamic-pulse');
        }
        const elLotLon = document.getElementById('radarLotLonDisplay');
        if (elLotLon) {
            elLotLon.textContent = '---';
            elLotLon.classList.remove('dynamic-pulse');
        }
        const elSongThuTru = document.getElementById('lblSongThuTru');
        if (elSongThuTru) elSongThuTru.textContent = '⏳ CHỜ GIỜ QUAY (18H15)';

        const elTop4 = document.getElementById('radarTop4Chips');
        if (elTop4) {
            elTop4.innerHTML = '<span style="color: #64748B; font-size: 14px; font-weight: 700; padding: 4px 10px;">⏳ CHỜ GIỜ QUAY (18H15)</span>';
        }

        const elDan9 = document.getElementById('radarDan9Chips');
        if (elDan9) {
            elDan9.innerHTML = '<span style="color: #64748B; font-size: 13px;">⏳ CHỜ GIỜ QUAY (18H15)</span>';
        }
        const elDan9Dao = document.getElementById('radarDan9DaoChips');
        if (elDan9Dao) elDan9Dao.innerHTML = '';

        const elDan9Sub = document.getElementById('radarDan9Subtitle');
        if (elDan9Sub) {
            elDan9Sub.innerHTML = '<span style="color: #64748B;">Chưa có giải quay (18h15 bắt đầu xổ G7, G6, G5)</span>';
        }
        const elCountDan9 = document.getElementById('lblCountDan9');
        if (elCountDan9) elCountDan9.textContent = '0 SỐ';

        const elDanLot = document.getElementById('radarDanLotDisplay');
        if (elDanLot) elDanLot.textContent = '⏳ CHỜ GIỜ QUAY (18H15)';
        const lblCountLot = document.getElementById('lblCountLot');
        if (lblCountLot) lblCountLot.textContent = '0 số';

        // 1.5. Càng 3D & Bảng 5 Cột
        const elBadgeCang = document.getElementById('badgeCangTop3');
        if (elBadgeCang) elBadgeCang.textContent = 'Top 3 Càng: ⏳ CHỜ GIỜ QUAY (18H15)';
        const elBT = document.getElementById('cangBachThuChips');
        if (elBT) elBT.innerHTML = '<span style="color:#64748B; font-size:14px; font-weight:700;">⏳ CHỜ GIỜ QUAY (18H15)</span>';
        const elTT = document.getElementById('cangTuThuDisplay');
        if (elTT) elTT.textContent = '---';
        const elD9 = document.getElementById('cangDan9Display');
        if (elD9) elD9.textContent = '---';

        const tbody5 = document.getElementById('tbody5Cols');
        if (tbody5) tbody5.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #94A3B8; padding: 25px; font-style: italic;">⏳ CHỜ GIỜ QUAY (18H15) - Hệ thống sẽ quét điểm và bảng 5 cột ngay khi các giải bắt đầu xổ.</td></tr>';
        ['cntAll', 'cntTop', 'cntLot', 'cntDiscard'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '0';
        });

        const section2Title = document.getElementById('lblSection2Title');
        if (section2Title) section2Title.textContent = 'KẾT QUẢ DÀN SỐ (BÓNG RƠI 18H15 BẮT ĐẦU DÒ CẦU ĐỘNG)';

        // 1.6. Khóa tất cả nút Copy
        setCopyButtonsLocked(true);

        // 1.7. Xóa các biến copy tạm thời
        window.currentRadarBT = '';
        window.currentRadarLotLon = '';
        window.currentRadarST = '';
        window.currentRadarTT = '';
        window.currentRadarDan9 = '';
        window.currentRadarDan9Goc = '';
        window.currentRadarDan9Dao = '';
        window.currentRadarDan9All = '';
        window.currentRadarLot = '';
        window.currentCangBT = '';
        window.currentCangTT = '';
        window.currentCangD9 = '';
        window.currentRadarTableText = '';
        return 'WAITING';
    } 
    // 2. Kịch bản: Giờ < 17h00 -> Hiển thị dữ liệu cũ (nếu có)
    else if (totalMinutes < 17 * 60) {
        window.isRadarWaitingMode = false;
        setCopyButtonsLocked(false);
        if (radarData) {
            renderRadarHeaderInfo();
            renderFastLockBanner();
            renderLivePrizeChips();
            renderRadarTopSummaries();
            renderRadarCang3D();
            renderRadar5ColTable();
            renderRadarFrame3Day();
            renderRadarHistoryTable();
            checkLock();
        }
        return 'OLD_DATA';
    } 
    // 3. Kịch bản: Giờ >= 18h14 -> Hiển thị dữ liệu live
    else {
        window.isRadarWaitingMode = false;
        setCopyButtonsLocked(false);
        if (radarData) {
            renderRadarHeaderInfo();
            renderFastLockBanner();
            renderLivePrizeChips();
            renderRadarTopSummaries();
            renderRadarCang3D();
            renderRadar5ColTable();
            renderRadarFrame3Day();
            renderRadarHistoryTable();
            checkLock();
        }
        return 'LIVE';
    }
}
window.checkResetTime = checkResetTime;

// Chạy kiểm tra reset thời gian mỗi 1 phút
setInterval(() => {
    checkResetTime();
}, 60000);

window.renderRadarHeaderInfo = renderRadarHeaderInfo;
window.renderFastLockBanner = renderFastLockBanner;
window.renderLivePrizeChips = renderLivePrizeChips;
window.renderRadarTopSummaries = renderRadarTopSummaries;
window.renderRadarCang3D = renderRadarCang3D;
window.renderRadar5ColTable = renderRadar5ColTable;
window.renderRadarFrame3Day = renderRadarFrame3Day;
window.renderRadarHistoryTable = renderRadarHistoryTable;
window.fetchAndRenderRadarLive = fetchAndRenderRadarLive;

let pollingInterval;

async function fetchData() {
    await fetchAndRenderRadarLive(true);
}

function startPolling(mockDate = null) {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
    const now = mockDate || (window.__mockDate ? new Date(window.__mockDate) : new Date());
    const hour = now.getHours();
    const minute = now.getMinutes();
    if (hour === 18 && minute >= 14 && minute <= 35) {
        pollingInterval = setInterval(fetchData, 3000);
        console.log(`[Polling Real-time] Đang trong khung giờ quay thưởng 18h14 - 18h35 (${hour}h${minute}). Đã kích hoạt polling mỗi 3 giây.`);
    }
    window.pollingInterval = pollingInterval;
    return pollingInterval;
}

window.fetchData = fetchData;
window.startPolling = startPolling;
startPolling();

// Định kỳ kiểm tra (mỗi 10 giây) để tự động kích hoạt polling nếu người dùng giữ mở tab trước 18h14
setInterval(() => {
    const now = window.__mockDate ? new Date(window.__mockDate) : new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    if (hour === 18 && minute >= 14 && minute <= 35) {
        if (!pollingInterval) {
            startPolling();
        }
    } else {
        if (pollingInterval && !window.__mockDate) {
            clearInterval(pollingInterval);
            pollingInterval = null;
            window.pollingInterval = null;
            console.log('[Polling Real-time] Ngoài khung giờ 18h14 - 18h35, đã dừng polling.');
        }
    }
}, 10000);

function startRadarLivePolling() {
    startPolling();
}

function renderRadarHeaderInfo() {
    if (!radarData) return;
    
    const elTargetDate = document.getElementById('radarPillTargetDate');
    if (elTargetDate) elTargetDate.textContent = radarData.target_date || 'Hôm nay';

    const elDynamicTarget = document.getElementById('lblRadarTargetDate');
    if (elDynamicTarget) elDynamicTarget.textContent = (radarData.target_date || 'HÔM NAY').toUpperCase();

    const elDateTitle = document.getElementById('radarLiveDateTitle');
    if (elDateTitle) elDateTitle.textContent = (radarData.target_date || 'HÔM NAY').toUpperCase();

    const elPrevInfo = document.getElementById('radarPillPrevInfo');
    if (elPrevInfo) elPrevInfo.innerHTML = `Đề <span style="color:#67E8F9; font-weight:900;">${radarData.prev_de || '--'}</span> (${radarData.prev_date || 'Kỳ trước'})`;

    const elHead = document.getElementById('radarPillHead');
    if (elHead && radarData.head_targets) {
        elHead.textContent = `Đầu ${radarData.head_targets[0]} + Bóng ${radarData.head_targets[1]}`;
    }

    const elTail = document.getElementById('radarPillTail');
    if (elTail && radarData.tail_targets) {
        elTail.textContent = `Đuôi ${radarData.tail_targets[0]} + Bóng ${radarData.tail_targets[1]}`;
    }

    const elLastUpdated = document.getElementById('radarLastUpdated');
    if (elLastUpdated) {
        elLastUpdated.textContent = radarData.last_updated || new Date().toLocaleTimeString('vi-VN');
    }

    const elProgress = document.getElementById('radarProgressText');
    if (elProgress) {
        const filled = radarData.filled_count || 0;
        const total = radarData.total_count || 26;
        const actualDe = radarData.actual_de || '';
        const isG5Done = radarData.is_g5_6_done || radarData.is_locked || (filled >= 26);
        const isDynamic = (radarData.dan_type === 'DYNAMIC' || radarData.radar_status === 'DYNAMIC');

        if (actualDe) {
            elProgress.innerHTML = `<span style="color: #34D399; font-weight: 800;">${filled}/${total} GIẢI • ĐÃ CÓ ĐỀ ${actualDe} 🎯</span>`;
        } else if (isG5Done) {
            elProgress.innerHTML = `<span style="color: #FBBF24; font-weight: 800;">🔒 ĐÃ KHÓA CHỐT DÀN (HẾT G5.6)</span>`;
        } else if (isDynamic || filled > 0) {
            elProgress.innerHTML = `<span style="color: #38BDF8; font-weight: 800;">⚡ DÀN ĐỘNG: ${filled}/${total} GIẢI (ĐANG DÒ CẦU...)</span>`;
        } else {
            elProgress.textContent = `0/${total} GIẢI (CHỜ 18H15)`;
        }
    }
}

function renderFastLockBanner() {
    if (!radarData) return;
    const banner = document.getElementById('radarFastLockBanner');
    const titleEl = document.getElementById('lblFastLockTitle');
    const subEl = document.getElementById('lblFastLockSub');
    const badgeEl = document.getElementById('lblCountdownLock');
    const iconEl = document.getElementById('fastLockIcon');
    const iconBox = document.getElementById('fastLockIconBox');
    const btnQuick = document.getElementById('btnQuickCopyAll');

    const filled = radarData.filled_count || 0;
    const total = radarData.total_count || 26;
    const isLocked = radarData.is_locked || (radarData.dan_type === 'LOCKED') || radarData.is_g5_6_done;
    const isDynamic = (radarData.dan_type === 'DYNAMIC' || radarData.radar_status === 'DYNAMIC');
    const isBeforeDraw = (radarData.radar_status === 'BEFORE_DRAW' || radarData.dan_type === 'NONE' || (filled === 0 && !radarData.actual_de));
    const actualDe = radarData.actual_de || '';

    if (banner) {
        banner.classList.remove('dynamic-pulse');
    }

    if (actualDe) {
        if (banner) {
            banner.style.borderColor = 'rgba(16, 185, 129, 0.7)';
            banner.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 78, 59, 0.3) 100%)';
        }
        if (iconBox) {
            iconBox.style.background = 'rgba(16, 185, 129, 0.25)';
            iconBox.style.color = '#34D399';
        }
        if (iconEl) iconEl.className = 'fa-solid fa-circle-check';
        if (badgeEl) {
            badgeEl.className = 'badge';
            badgeEl.style.background = 'rgba(16, 185, 129, 0.25)';
            badgeEl.style.color = '#34D399';
            badgeEl.style.border = '1px solid #10B981';
            badgeEl.innerHTML = `🎯 ĐỀ VỀ: <strong>${actualDe}</strong>`;
        }

        const isBtHit = (radarData.top_1 === actualDe);
        const isTtHit = (radarData.top_4 || []).includes(actualDe);
        const isD9Hit = (radarData.dan_9_so || []).includes(actualDe);
        const isLotHit = (radarData.dan_lot || []).includes(actualDe);

        let hitStatus = [];
        if (isBtHit) hitStatus.push('👑 TRÚNG BẠCH THỦ!');
        else if (isTtHit) hitStatus.push('🔥 TRÚNG TỨ THỦ!');
        else if (isD9Hit) hitStatus.push('🎯 TRÚNG DÀN 9S!');
        else if (isLotHit) hitStatus.push('🛡️ TRÚNG DÀN LÓT!');
        else hitStatus.push('KỲ QUAY ĐÃ HOÀN TẤT');

        if (titleEl) titleEl.textContent = `🎯 KẾT QUẢ XSMB HÔM NAY: ĐỀ VỀ ${actualDe}`;
        const bannerEl = document.getElementById('banner');
        if (bannerEl) bannerEl.innerHTML = `🎯 KẾT QUẢ XSMB HÔM NAY: ĐỀ VỀ ${actualDe}`;
        if (subEl) subEl.innerHTML = `<span style="color: #34D399; font-weight: 800;">${hitStatus.join(' • ')}</span> | Bạch thủ: ${radarData.top_1 || '--'} | Tứ thủ: ${(radarData.top_4||[]).join(', ')}`;
        if (btnQuick) btnQuick.innerHTML = `<i class="fa-solid fa-copy"></i> SAO CHÉP KẾT QUẢ ĐỐI CHIẾU (${actualDe})`;
    } else if (isLocked) {
        if (banner) {
            banner.style.borderColor = 'rgba(245, 158, 11, 0.9)';
            banner.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(180, 83, 9, 0.3) 100%)';
            banner.style.boxShadow = '0 0 25px rgba(245, 158, 11, 0.35)';
        }
        if (iconBox) {
            iconBox.style.background = 'rgba(245, 158, 11, 0.3)';
            iconBox.style.color = '#FBBF24';
        }
        if (iconEl) iconEl.className = 'fa-solid fa-lock';
        if (badgeEl) {
            badgeEl.className = 'badge badge-gold badge-locked-hard';
            badgeEl.innerHTML = `🔒 DÀN CỨNG - ĐÃ CHỐT HẠ`;
        }
        const bannerTitle = '🔒 DÀN CỨNG - ĐÃ CHỐT HẠ (HẾT G5.6) - VÀO TIỀN TRƯỚC 18H28!';
        if (titleEl) titleEl.textContent = bannerTitle;
        const bannerEl = document.getElementById('banner');
        if (bannerEl) bannerEl.innerHTML = bannerTitle;
        if (subEl) subEl.innerHTML = `<span style="color: #FBBF24; font-weight: 800;">⚡ VÀO TIỀN NGAY CHO GIẢI ĐẶC BIỆT HÔM NAY!</span> Đã chốt hạ sau khi hết Giải 5.6. Hạn chót vào tiền trước 18h28!`;
        if (btnQuick) {
            btnQuick.innerHTML = `<i class="fa-solid fa-bolt"></i> COPY GÓI CHỐT GẤP (VÀO TIỀN NGAY)`;
        }
    } else if (isDynamic || filled > 0) {
        if (banner) {
            banner.style.borderColor = 'rgba(56, 189, 248, 0.8)';
            banner.style.background = 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(14, 165, 233, 0.25) 100%)';
            banner.classList.add('dynamic-pulse');
        }
        if (iconBox) {
            iconBox.style.background = 'rgba(56, 189, 248, 0.25)';
            iconBox.style.color = '#38BDF8';
        }
        if (iconEl) iconEl.className = 'fa-solid fa-bolt';
        const liveTitle = `⚡ DÀN ĐỘNG - ĐANG DÒ CẦU TRỰC TIẾP (${filled}/${total} GIẢI)...`;
        if (titleEl) titleEl.textContent = liveTitle;
        const bannerEl = document.getElementById('banner');
        if (bannerEl) bannerEl.textContent = liveTitle;
        if (subEl) subEl.innerHTML = `<span style="color: #38BDF8; font-weight: 800;">Dàn số đang biến thiên theo lồng quay (G7, G6, G5).</span> Hệ thống sẽ tự động <strong>CHỐT DÀN CỨNG</strong> ngay khi có kết quả G5.6!`;
        if (badgeEl) {
            badgeEl.className = 'badge badge-dynamic-live';
            badgeEl.innerHTML = `⚡ DÀN ĐỘNG (${filled}/${total})`;
        }
        if (btnQuick) {
            btnQuick.innerHTML = `<i class="fa-solid fa-eye"></i> DÀN ĐANG DÒ - CHỜ HẾT G5.6 ĐỂ CHỐT`;
        }
    } else {
        if (banner) {
            banner.style.borderColor = 'rgba(100, 116, 139, 0.4)';
            banner.style.background = 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)';
        }
        if (iconBox) {
            iconBox.style.background = 'rgba(100, 116, 139, 0.2)';
            iconBox.style.color = '#94A3B8';
        }
        if (iconEl) iconEl.className = 'fa-solid fa-clock';
        const waitTitle = `⏳ CHỜ GIỜ QUAY THƯỞNG (18H15) - CHƯA CÓ BÓNG RƠI`;
        if (titleEl) titleEl.textContent = waitTitle;
        const bannerEl = document.getElementById('banner');
        if (bannerEl) bannerEl.textContent = waitTitle;
        if (subEl) subEl.textContent = `Lúc 18h15 bóng bắt đầu rơi (G7, G6, G5) -> Dàn Động kích hoạt. Khi có kết quả HẾT G5.6 (~18h24) -> Khóa Chốt Dàn Cứng để vào tiền trước 18h28!`;
        if (badgeEl) {
            badgeEl.className = 'badge';
            badgeEl.style.background = 'rgba(100, 116, 139, 0.2)';
            badgeEl.style.color = '#94A3B8';
            badgeEl.innerHTML = `⏳ Chờ 18h15`;
        }
        if (btnQuick) {
            btnQuick.innerHTML = `<i class="fa-solid fa-hourglass-start"></i> CHƯA ĐẾN GIỜ QUAY`;
        }
    }
}

function buildChipHtml(valStr, prizeCode, hp) {
    const giaiAttr = (prizeCode || '').replace(/^G/i, '');
    if (!valStr) {
        return `<span class="prize-num-chip" data-giai="${giaiAttr}" style="opacity: 0.5;"><span style="letter-spacing: 2px;"></span></span>`;
    }
    
    let digitsHtml = '';
    for (let idx = 1; idx <= valStr.length; idx++) {
        const char = valStr[idx - 1];
        const posKey = `${prizeCode}_${idx}`;
        const info = hp ? hp[posKey] : null;
        
        let cellClass = 'prize-digit-cell';
        let tagHtml = '';
        
        if (info) {
            const cycle = info.cycle || 1;
            if (cycle >= 3) {
                cellClass += ' streak-3d';
                tagHtml = `<span class="digit-tag">${cycle}d</span>`;
            } else if (cycle === 2) {
                cellClass += ' streak-2d';
                tagHtml = `<span class="digit-tag">2d</span>`;
            } else {
                cellClass += ' streak-1d';
                tagHtml = `<span class="digit-tag">1d</span>`;
            }
        }
        
        digitsHtml += `
            <span class="${cellClass}">
                <span class="prize-digit-char">${char}</span>
                ${tagHtml}
            </span>
        `;
    }
    
    return `<span class="prize-num-chip" data-giai="${giaiAttr}">${digitsHtml}</span>`;
}

// =======================================================
// =======================================================
// LOGIC KHÓA CHỐT DÀN TỰ ĐỘNG TẠI HẾT G5.6 HOẶC MỐC 18H24 (Fix Lỗi 2 & 4)
// =======================================================
let isRadarLockedState = false;

function checkLock() {
    if (window.isRadarWaitingMode) return;
    // Kiểm tra Hết Giải 5.6 (data-giai="5.6")
    const g5_6 = document.querySelector('[data-giai="5.6"]');
    const now = window.__mockDate ? new Date(window.__mockDate) : new Date();
    const lockTime = new Date(now);
    lockTime.setHours(18, 24, 0, 0);

    const hasG5_6 = Boolean(g5_6 && g5_6.textContent.replace(/[•\s]/g, '') !== '');
    const isPast18h24 = (now >= lockTime);
    const serverLocked = Boolean(window.radarData && (window.radarData.is_g5_6_done || window.radarData.is_locked || window.radarData.dan_type === 'LOCKED'));

    if ((hasG5_6 || isPast18h24 || serverLocked) && !isRadarLockedState) {
        const bannerMsg = '🔒 DÀN CỨNG - ĐÃ CHỐT HẠ (HẾT G5.6) - VÀO TIỀN TRƯỚC 18H28!';
        const banner = document.getElementById('banner');
        if (banner) {
            banner.innerHTML = bannerMsg;
            banner.classList.remove('dynamic-pulse');
        }
        const titleEl = document.getElementById('lblFastLockTitle');
        if (titleEl) {
            titleEl.textContent = bannerMsg;
        }
        const badgeEl = document.getElementById('lblCountdownLock');
        if (badgeEl) {
            badgeEl.className = 'badge badge-gold badge-locked-hard';
            badgeEl.innerHTML = '🔒 DÀN CỨNG (HẾT G5.6)';
        }
        const subEl = document.getElementById('lblFastLockSub');
        if (subEl) {
            subEl.innerHTML = '<span style="color: #FBBF24; font-weight: 800;">⚡ VÀO TIỀN NGAY CHO GIẢI ĐẶC BIỆT HÔM NAY!</span> Đã chốt hạ sau khi hết Giải 5.6 (hoặc backup 18h24). Vào tiền trước 18h28!';
        }
        isRadarLockedState = true;
        console.log('🔒 Đã chốt dàn cứng lúc:', now.toLocaleTimeString('vi-VN'));
    }
}
setInterval(checkLock, 1000); // Kiểm tra mỗi 1 giây

function renderLivePrizeChips() {
    if (!radarData || !radarData.live_prizes) return;
    const lp = radarData.live_prizes;
    const hp = radarData.highlight_positions || {};

    const updateStatus = (id, hasVal) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (hasVal) {
            el.innerHTML = '<span class="badge-done"><i class="fa-solid fa-circle-check"></i> Đã quay</span>';
        } else {
            el.innerHTML = '<span class="badge-waiting" style="color: #64748B; font-size: 11px;"><i class="fa-regular fa-clock"></i> Chờ quay</span>';
        }
    };

    // G1
    const elG1 = document.getElementById('liveG1Chips');
    if (elG1) {
        elG1.innerHTML = buildChipHtml(lp.g1, 'G1', hp);
        updateStatus('statusG1', Boolean(lp.g1 && lp.g1.trim()));
    }

    // G2 (2.1, 2.2)
    const elG2 = document.getElementById('liveG2Chips');
    if (elG2) {
        const g2List = Array.isArray(lp.g2) ? lp.g2 : [lp.g2];
        elG2.innerHTML = g2List.map((val, idx) => buildChipHtml(val, `G2.${idx + 1}`, hp)).join('');
        updateStatus('statusG2', g2List.some(v => Boolean(v && v.trim())));
    }

    // G3 (3.1 -> 3.6)
    const elG3 = document.getElementById('liveG3Chips');
    if (elG3) {
        const g3List = Array.isArray(lp.g3) ? lp.g3 : [];
        elG3.innerHTML = g3List.map((val, idx) => buildChipHtml(val, `G3.${idx + 1}`, hp)).join('');
        updateStatus('statusG3', g3List.some(v => Boolean(v && v.trim())));
    }

    // G4 (4.1 -> 4.4)
    const elG4 = document.getElementById('liveG4Chips');
    if (elG4) {
        const g4List = Array.isArray(lp.g4) ? lp.g4 : [];
        elG4.innerHTML = g4List.map((val, idx) => buildChipHtml(val, `G4.${idx + 1}`, hp)).join('');
        updateStatus('statusG4', g4List.some(v => Boolean(v && v.trim())));
    }

    // G5 (5.1 -> 5.6)
    const elG5 = document.getElementById('liveG5Chips');
    if (elG5) {
        const g5List = Array.isArray(lp.g5) ? lp.g5 : [];
        elG5.innerHTML = g5List.map((val, idx) => buildChipHtml(val, `G5.${idx + 1}`, hp)).join('');
        updateStatus('statusG5', g5List.some(v => Boolean(v && v.trim())));
    }

    // G6 (6.1 -> 6.3) - Fix Lỗi 3
    const elG6 = document.getElementById('liveG6Chips');
    if (elG6) {
        const g6List = Array.isArray(lp.g6) ? lp.g6 : [];
        elG6.innerHTML = g6List.map((val, idx) => buildChipHtml(val, `G6.${idx + 1}`, hp)).join('');
        updateStatus('statusG6', g6List.some(v => Boolean(v && v.trim())));
    }

    // G7 (7.1 -> 7.4) - Fix Lỗi 3
    const elG7 = document.getElementById('liveG7Chips');
    if (elG7) {
        const g7List = Array.isArray(lp.g7) ? lp.g7 : [];
        elG7.innerHTML = g7List.map((val, idx) => buildChipHtml(val, `G7.${idx + 1}`, hp)).join('');
        updateStatus('statusG7', g7List.some(v => Boolean(v && v.trim())));
    }
}

function renderRadarTopSummaries() {
    if (!radarData) return;
    
    const isBeforeDraw = (radarData.radar_status === 'BEFORE_DRAW' || radarData.dan_type === 'NONE' || (radarData.filled_count === 0 && !radarData.actual_de));
    const isDynamic = (radarData.dan_type === 'DYNAMIC' || radarData.radar_status === 'DYNAMIC');
    const isLocked = (radarData.radar_status === 'LOCKED' || radarData.dan_type === 'LOCKED' || radarData.is_locked);

    const elTop1 = document.getElementById('radarTop1Display');
    const elLotLon = document.getElementById('radarLotLonDisplay');
    const elSongThuTru = document.getElementById('lblSongThuTru');
    const elTop4 = document.getElementById('radarTop4Chips');
    const elDan9 = document.getElementById('radarDan9Chips');
    const elDan9Dao = document.getElementById('radarDan9DaoChips');
    const elDan9Sub = document.getElementById('radarDan9Subtitle');
    const elDanLot = document.getElementById('radarDanLotDisplay');
    const lblCountLot = document.getElementById('lblCountLot');
    const elCountDan9 = document.getElementById('lblCountDan9');
    const section2Title = document.getElementById('lblSection2Title');

    if (isBeforeDraw) {
        if (elTop1) {
            elTop1.textContent = '---';
            elTop1.classList.remove('dynamic-pulse');
        }
        if (elLotLon) {
            elLotLon.textContent = '---';
            elLotLon.classList.remove('dynamic-pulse');
        }
        if (elSongThuTru) elSongThuTru.textContent = 'Chờ giờ quay (18h15)';
        if (elTop4) {
            elTop4.innerHTML = `<span style="color: #64748B; font-size: 14px; font-weight: 700; padding: 4px 10px;">⏳ Chưa có bóng rơi...</span>`;
        }
        if (elDan9) {
            elDan9.innerHTML = `<span style="color: #64748B; font-size: 13px;">Chờ giờ quay 18h15...</span>`;
        }
        if (elDan9Dao) elDan9Dao.innerHTML = '';
        if (elDan9Sub) {
            elDan9Sub.innerHTML = `<span style="color: #64748B;">Chưa có giải quay (18h15 bắt đầu xổ G7, G6, G5)</span>`;
        }
        if (elCountDan9) elCountDan9.textContent = `0 SỐ`;
        if (elDanLot) elDanLot.textContent = 'Chưa đến giờ quay (18h15). Dàn sẽ hiển thị động khi có bóng rơi.';
        if (lblCountLot) lblCountLot.textContent = '0 số';
        if (section2Title) section2Title.textContent = 'KẾT QUẢ DÀN SỐ (BÓNG RƠI 18H15 BẮT ĐẦU DÒ CẦU ĐỘNG)';
        return;
    }

    // Top 1 Bạch Thủ & Lót Lộn Song Thủ Trụ
    const top1 = radarData.top_1 || '';
    const lotLon = radarData.lot_lon || '';
    const songThu = radarData.song_thu_tru || (top1 ? [top1, lotLon].filter(Boolean) : []);

    if (elTop1) {
        elTop1.textContent = top1 || '---';
        if (isDynamic) elTop1.classList.add('dynamic-pulse');
        else elTop1.classList.remove('dynamic-pulse');
    }

    if (elLotLon) {
        elLotLon.textContent = lotLon || '---';
        if (isDynamic) elLotLon.classList.add('dynamic-pulse');
        else elLotLon.classList.remove('dynamic-pulse');
    }

    if (elSongThuTru) {
        elSongThuTru.textContent = top1 ? `${top1} - ${lotLon} ${isDynamic ? '(⚡ Động)' : '(🔒 Chốt hạ)'}` : 'Đang dò cầu...';
    }

    window.currentRadarBT = top1;
    window.currentRadarLotLon = lotLon;
    window.currentRadarST = songThu.join(', ');

    // Top 4 Tứ Thủ
    const top4List = radarData.top_4 || (top1 ? [top1] : []);
    window.currentRadarTT = top4List.join(', ');
    if (elTop4) {
        if (top4List.length === 0) {
            elTop4.innerHTML = `<span style="color: #64748B;">Đang tính toán theo bóng rơi...</span>`;
        } else {
            const pulseClass = isDynamic ? ' dynamic-pulse' : '';
            elTop4.innerHTML = top4List.map(num => `
                <span class="badge${pulseClass}" style="background: rgba(56, 189, 248, 0.2); color: #38BDF8; font-size: 15px; font-weight: 800; padding: 4px 12px; border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 8px;">
                    ${num}
                </span>
            `).join('');
        }
    }

    // Dàn 9 Số Cội Nguồn & 8 Số Đảo Bảo Hiểm (Tổng 17 Số)
    const dan9List = radarData.dan_9_so || [];
    const dan9DaoList = [];
    dan9List.forEach(num => {
        if (num && num.length >= 2) {
            const rev = num[1] + num[0];
            if (num[0] !== num[1] && !dan9List.includes(rev) && !dan9DaoList.includes(rev)) {
                dan9DaoList.push(rev);
            }
        }
    });

    const total17List = [...dan9List, ...dan9DaoList];
    window.currentRadarDan9Goc = dan9List.join(', ');
    window.currentRadarDan9Dao = dan9DaoList.join(', ');
    window.currentRadarDan9All = total17List.join(', ');
    window.currentRadarDan9 = window.currentRadarDan9All;

    // Tầng 1: 9 số gốc
    if (elDan9) {
        if (dan9List.length === 0) {
            elDan9.innerHTML = `<span style="color: #64748B;">Đang dò cầu động...</span>`;
        } else {
            elDan9.innerHTML = dan9List.map(num => `
                <span class="badge badge-gold" style="font-size: 13.5px; font-weight: 900; padding: 3px 8px; border-radius: 6px; font-family: 'JetBrains Mono', monospace;">
                    ${num}
                </span>
            `).join('');
        }
    }

    // Tầng 2: 8 số đảo
    if (elDan9Dao) {
        if (dan9DaoList.length === 0) {
            elDan9Dao.innerHTML = '';
        } else {
            elDan9Dao.innerHTML = dan9DaoList.map(num => `
                <span class="badge" style="background: rgba(56, 189, 248, 0.2); color: #38BDF8; font-size: 13.5px; font-weight: 800; padding: 3px 8px; border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 6px; font-family: 'JetBrains Mono', monospace;">
                    ${num}
                </span>
            `).join('');
        }
    }

    if (elDan9Sub) {
        const heads = radarData.dan_9_heads || [];
        const tails = radarData.dan_9_tails || [];
        const statusLabel = isDynamic ? '<span style="color:#38BDF8; font-weight:800;">⚡ DÀN ĐỘNG</span>' : '<span style="color:#FBBF24; font-weight:800;">🔒 DÀN CỨNG</span>';
        elDan9Sub.innerHTML = `${statusLabel} | Tầng 1: Gốc (${dan9List.length}s) | Tầng 2: Đảo (${dan9DaoList.length}s bảo hiểm)<br><span style="color: #64748B;">Top 3 Đầu [${heads.join(',')}] × Top 3 Đuôi [${tails.join(',')}]</span>`;
    }

    if (elCountDan9) {
        elCountDan9.textContent = `${total17List.length} SỐ`;
    }

    // Dàn Lót Hợp Lệ
    const danLotList = radarData.dan_lot || [];
    window.currentRadarLot = danLotList.join(', ');
    if (elDanLot) {
        elDanLot.textContent = danLotList.length > 0 ? danLotList.join(', ') : (isDynamic ? 'Đang cập nhật lót theo giải xổ...' : 'Tất cả các số lót hợp lệ đều trùng khớp trong khung 60s N1');
    }
    if (lblCountLot) {
        lblCountLot.textContent = `${danLotList.length} số`;
    }

    if (section2Title) {
        if (isDynamic) {
            section2Title.innerHTML = `<span style="color: #38BDF8;"><i class="fa-solid fa-bolt"></i> ⚡ DÀN ĐỘNG ĐANG DÒ CẦU (CHỐT HẠ KHI HẾT G5.6)</span>`;
        } else {
            section2Title.innerHTML = `<span style="color: #FBBF24;"><i class="fa-solid fa-lock"></i> 🔒 DÀN CỨNG CHÍNH THỨC (ĐÃ CHỐT HẾT G5.6)</span>`;
        }
    }
}

function renderRadarCang3D() {
    if (!radarData) return;
    const isBeforeDraw = (radarData.radar_status === 'BEFORE_DRAW' || radarData.dan_type === 'NONE' || (radarData.filled_count === 0 && !radarData.actual_de));
    const c3 = radarData.cang_3d_live || {};
    const top3Cang = c3.top3_cang || [];
    const cangBT = c3.cang_bt_3s || [];
    const cangTT = c3.cang_tt_12s || [];
    const cangD9 = c3.cang_d9_27s || [];

    const elCangDate = document.getElementById('lblCangTargetDate');
    if (elCangDate) {
        elCangDate.textContent = (radarData.target_date || 'HÔM NAY').toUpperCase();
    }

    const elBadge = document.getElementById('badgeCangTop3');
    const elBT = document.getElementById('cangBachThuChips');
    const elTT = document.getElementById('cangTuThuDisplay');
    const elD9 = document.getElementById('cangDan9Display');

    if (isBeforeDraw) {
        if (elBadge) elBadge.textContent = 'Top 3 Càng: Chờ giờ quay 18h15';
        if (elBT) elBT.innerHTML = '<span style="color:#64748B; font-size:14px; font-weight:700;">⏳ Chờ giờ quay (18h15)...</span>';
        if (elTT) elTT.textContent = '---';
        if (elD9) elD9.textContent = '---';
        window.currentCangBT = '';
        window.currentCangTT = '';
        window.currentCangD9 = '';
        return;
    }

    window.currentCangBT = cangBT.join(', ');
    window.currentCangTT = cangTT.join(', ');
    window.currentCangD9 = cangD9.join(', ');

    if (elBadge) {
        const tamStr = c3.tam_g1 ? `Tâm G1: ${c3.tam_g1}` : 'Chờ G1 quay (18h16)';
        const tongStr = c3.tong_de ? `Tổng Đề: ${c3.tong_de}` : '';
        elBadge.textContent = `Top 3 Càng: [${top3Cang.join(', ')}] (${tamStr} | ${tongStr})`;
    }

    // Hiển thị kiểm tra nổ 3 càng nếu đã có kết quả
    const actual3D = radarData.actual_3d || (radarData.actual_de && radarData.live_prizes?.g1 ? '' : '');
    
    if (elBT) {
        elBT.innerHTML = cangBT.map(num => {
            const isHit = actual3D && num === actual3D;
            const hitStyle = isHit ? 'background: #10B981 !important; color: #FFF !important; box-shadow: 0 0 15px #10B981;' : '';
            return `
                <span class="badge badge-gold" style="font-size: 15px; font-weight: 900; padding: 4px 12px; font-family: 'JetBrains Mono', monospace; border-radius: 8px; ${hitStyle}">
                    ${isHit ? '🎯 ' : ''}${num}
                </span>
            `;
        }).join('');
    }

    if (elTT) {
        elTT.textContent = cangTT.join(', ');
    }

    if (elD9) {
        elD9.textContent = cangD9.join(', ');
    }
}

function renderRadar5ColTable() {
    if (!radarData) return;
    const tbody = document.getElementById('tbody5Cols');
    if (!tbody) return;

    const isBeforeDraw = (radarData.radar_status === 'BEFORE_DRAW' || radarData.dan_type === 'NONE' || (radarData.filled_count === 0 && !radarData.actual_de));
    const list = radarData.table_5cols || [];
    
    if (isBeforeDraw || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #94A3B8; padding: 25px; font-style: italic;">⏳ Chưa đến giờ quay (18h15) - Hệ thống sẽ quét điểm và bảng 5 cột ngay khi các giải bắt đầu xổ.</td></tr>`;
        const elAll = document.getElementById('cntAll'); if (elAll) elAll.textContent = '0';
        const elTop = document.getElementById('cntTop'); if (elTop) elTop.textContent = '0';
        const elLot = document.getElementById('cntLot'); if (elLot) elLot.textContent = '0';
        const elDis = document.getElementById('cntDiscard'); if (elDis) elDis.textContent = '0';
        return;
    }
    
    // Đếm số lượng theo filter
    let cntAll = list.length;
    let cntTop = 0;
    let cntLot = 0;
    let cntDiscard = 0;

    list.forEach(item => {
        if (item.top_rank.includes('Top 1') || item.top_rank.includes('Top 4')) cntTop++;
        else if (item.top_rank.includes('Lót')) cntLot++;
        else cntDiscard++;
    });

    const elAll = document.getElementById('cntAll'); if (elAll) elAll.textContent = cntAll;
    const elTop = document.getElementById('cntTop'); if (elTop) elTop.textContent = cntTop;
    const elLot = document.getElementById('cntLot'); if (elLot) elLot.textContent = cntLot;
    const elDis = document.getElementById('cntDiscard'); if (elDis) elDis.textContent = cntDiscard;

    const filtered = list.filter(item => {
        if (currentRadarTableFilter === 'top') return item.top_rank.includes('Top 1') || item.top_rank.includes('Top 4');
        if (currentRadarTableFilter === 'lot') return item.top_rank.includes('Lót');
        if (currentRadarTableFilter === 'discard') return item.top_rank.includes('Loại');
        return true;
    });

    tbody.innerHTML = '';
    filtered.forEach(item => {
        const tr = document.createElement('tr');
        
        let rankColor = '#94A3B8';
        if (item.top_rank.includes('Top 1')) rankColor = '#FBBF24';
        else if (item.top_rank.includes('Top 4')) rankColor = '#38BDF8';
        else if (item.top_rank.includes('Lót')) rankColor = '#34D399';
        else if (item.top_rank.includes('Loại')) rankColor = '#FB7185';

        const isN1 = item.in_cap4;
        const n1Badge = isN1 
            ? `<span class="badge-n1-yes"><i class="fa-solid fa-check"></i> Có (N1)</span>`
            : `<span class="badge-n1-no">Không</span>`;

        const streakBadge = item.cycle_days >= 3
            ? `<span class="badge badge-gold" style="font-size: 11px;">${item.cycle_days} ngày</span>`
            : (item.cycle_days === 2 
                ? `<span class="badge" style="background: rgba(56,189,248,0.2); color:#38BDF8; font-size:11px;">2 ngày</span>`
                : `<span class="badge" style="background: rgba(100,116,139,0.2); color:#94A3B8; font-size:11px;">1 ngày</span>`);

        tr.innerHTML = `
            <td style="text-align: center; font-weight: 900; font-size: 17px; color: ${rankColor}; font-family: 'JetBrains Mono', monospace;">
                ${item.num}
            </td>
            <td style="font-size: 12px; color: #CBD5E1;">
                ${item.h_pos || ''} × ${item.t_pos || ''}
            </td>
            <td style="text-align: center;">
                ${streakBadge}
            </td>
            <td style="text-align: center;">
                ${n1Badge}
            </td>
            <td style="font-weight: 800; font-size: 12.5px; color: ${rankColor};">
                ${item.top_rank}
            </td>
        `;
        tbody.appendChild(tr);
    });

    window.currentRadarTableText = filtered.map(x => `${x.num} | ${x.h_pos} x ${x.t_pos} | ${x.cycle_days}d | N1: ${x.in_cap4_str} | ${x.top_rank}`).join('\n');
}

function renderRadarFrame3Day() {
    if (!radarData) return;
    const ft = radarData.frame_transition || {};
    
    // Auto-Shift Banner
    const elBanner = document.getElementById('radarAutoShiftBanner');
    const elMsg = document.getElementById('radarAutoShiftMsg');
    const elBadge = document.getElementById('radarAutoShiftBadge');
    const rowN2 = document.getElementById('tierRowN2');

    const lastRes = ft.last_result || '';
    const isHit = lastRes.includes('ĐÃ TRÚNG N1') || lastRes.includes('ĐÃ TRÚNG');

    if (elBanner) {
        if (isHit) {
            elBanner.className = 'auto-shift-banner banner-hit';
            if (elMsg) elMsg.innerHTML = `<i class="fa-solid fa-circle-check" style="font-size: 16px;"></i> <span>${lastRes}</span>`;
            if (elBadge) elBadge.textContent = 'ĐÃ TRÚNG N1 → RESET CẦU MỚI';
            if (rowN2) rowN2.classList.remove('tier-active-glow');
        } else {
            elBanner.className = 'auto-shift-banner banner-active-n2';
            if (elMsg) elMsg.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="font-size: 16px;"></i> <span>${lastRes}</span>`;
            if (elBadge) elBadge.textContent = '🎯 ĐANG ĐÁNH N2 (36 SỐ)';
            if (rowN2) rowN2.classList.add('tier-active-glow');
        }
    }

    // Lists
    const n1List = ft.dan_n1 || radarData.dan_tinh_4cap?.dan_60_cap4 || [];
    const n2List = ft.dan_n2 || radarData.dan_tinh_4cap?.dan_cap2_38so || [];
    const n3List = ft.dan_n3 || [];

    window.currentRadarFrameN1 = n1List.join(', ');
    window.currentRadarFrameN2 = n2List.join(', ');
    window.currentRadarFrameN3 = n3List.join(', ');

    const elN1 = document.getElementById('radarFrameN1List');
    if (elN1) elN1.textContent = n1List.join(', ');

    const elN2 = document.getElementById('radarFrameN2List');
    if (elN2) elN2.textContent = n2List.join(', ');

    const elN3 = document.getElementById('radarFrameN3List');
    if (elN3) elN3.textContent = n3List.join(', ');
}

let currentRadarHistoryFilter = 'all';

function renderRadarHistoryTable() {
    if (!radarData) return;
    const records = radarData.history_records || [];
    const summary = radarData.history_summary || {};

    // 5 Thẻ KPIs
    const elTop1 = document.getElementById('kpiRadarTop1');
    const elTop4 = document.getElementById('kpiRadarTop4');
    const elDan9 = document.getElementById('kpiRadarDan9');
    const elLot = document.getElementById('kpiRadarLot');
    const elCangTT = document.getElementById('kpiRadarCangTT');

    const tot = summary.total_evals || records.length || 0;
    if (elTop1) elTop1.textContent = `${summary.top1_rate || 0}% (${summary.top1_hits || 0}/${tot} kỳ)`;
    if (elTop4) elTop4.textContent = `${summary.top4_rate || 0}% (${summary.top4_hits || 0}/${tot} kỳ)`;
    if (elDan9) elDan9.textContent = `${summary.dan9_rate || 0}% (${summary.dan9_hits || 0}/${tot} kỳ)`;
    if (elLot) elLot.textContent = `${summary.lot_rate || 0}% (${summary.lot_hits || 0}/${tot} kỳ)`;
    if (elCangTT) elCangTT.textContent = `${summary.cang_tt_rate || 0}% (${summary.cang_tt_hits || 0}/${tot} kỳ)`;

    // Filter counts
    const cntAll = records.length;
    let cntTop1 = 0, cntTop4 = 0, cntDan9 = 0, cntLot = 0, cntCang = 0;
    records.forEach(r => {
        if (r.hit_top_1) cntTop1++;
        if (r.hit_top_4) cntTop4++;
        if (r.hit_dan_9) cntDan9++;
        if (r.hit_dan_lot) cntLot++;
        if (r.hit_cang_tt || r.hit_cang_bt) cntCang++;
    });

    const elCntAll = document.getElementById('cntHistAll');
    const elCntTop1 = document.getElementById('cntHistTop1');
    const elCntTop4 = document.getElementById('cntHistTop4');
    const elCntDan9 = document.getElementById('cntHistDan9');
    const elCntLot = document.getElementById('cntHistLot');
    const elCntCang = document.getElementById('cntHistCang');
    if (elCntAll) elCntAll.textContent = cntAll;
    if (elCntTop1) elCntTop1.textContent = cntTop1;
    if (elCntTop4) elCntTop4.textContent = cntTop4;
    if (elCntDan9) elCntDan9.textContent = cntDan9;
    if (elCntLot) elCntLot.textContent = cntLot;
    if (elCntCang) elCntCang.textContent = cntCang;

    // Filter records
    const filtered = records.filter(r => {
        if (currentRadarHistoryFilter === 'hit_top1') return r.hit_top_1;
        if (currentRadarHistoryFilter === 'hit_top4') return r.hit_top_4;
        if (currentRadarHistoryFilter === 'hit_dan9') return r.hit_dan_9;
        if (currentRadarHistoryFilter === 'hit_lot') return r.hit_dan_lot;
        if (currentRadarHistoryFilter === 'hit_cang') return r.hit_cang_tt || r.hit_cang_bt;
        return true;
    });

    const tbody = document.getElementById('tbodyRadarHistory');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 18px;">Không có kỳ quay nào khớp với bộ lọc này.</td></tr>`;
        return;
    }

    filtered.forEach((r, idx) => {
        const tr = document.createElement('tr');
        
        // Status badges
        const top1Badge = r.hit_top_1
            ? `<span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #34D399; font-weight: 800; border: 1px solid #10B981; font-size: 13px;">🎯 ${r.top_1}</span>`
            : `<span style="color: #94A3B8; font-weight: 600;">${r.top_1 || '---'}</span> <span style="font-size: 10px; color: #EF4444;">❌</span>`;

        const top4Badges = (r.top_4 || []).map(num => {
            const isMatch = num === r.de;
            return isMatch
                ? `<span class="badge" style="background: rgba(16, 185, 129, 0.25); color: #34D399; font-weight: 800; border: 1px solid #10B981; padding: 2px 6px;">🎯 ${num}</span>`
                : `<span class="badge" style="background: rgba(56, 189, 248, 0.1); color: #38BDF8; padding: 2px 5px; font-size: 11px;">${num}</span>`;
        }).join(' ');

        const cangStatus = r.hit_cang_tt || r.hit_cang_bt
            ? `<span class="badge badge-gold" style="font-size: 11px; font-weight: 900; padding: 2px 6px;">🌟 Nổ 3C (${r.actual_3d})</span>`
            : `<span style="color: #94A3B8; font-size: 12px; font-family: 'JetBrains Mono', monospace;">${r.actual_3d || '---'}</span> <span style="font-size: 10px; color: #EF4444;">❌</span>`;

        const d9Badges = (r.dan_9_so || []).map(num => {
            const isMatch = num === r.de;
            const isDao = !isMatch && (r.de && r.de.length === 2 && r.de[1] + r.de[0] === num);
            if (isMatch) {
                return `<span class="badge" style="background: rgba(16, 185, 129, 0.25); color: #34D399; font-weight: 800; border: 1px solid #10B981; padding: 1px 4px; margin-right: 3px;">🎯 ${num}</span>`;
            } else if (isDao) {
                return `<span class="badge" style="background: rgba(56, 189, 248, 0.25); color: #38BDF8; font-weight: 800; border: 1px solid #38BDF8; padding: 1px 4px; margin-right: 3px;" title="Trúng số đảo ${r.de}">🔄 ${num}</span>`;
            } else {
                return `<span style="font-size: 11px; color: #CBD5E1; margin-right: 4px;">${num}</span>`;
            }
        }).join('');

        const lotCount = (r.dan_lot || []).length;
        const lotStatus = r.hit_dan_lot
            ? `<span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #34D399; font-weight: 800; border: 1px solid #10B981;">🎯 Trúng (${lotCount}s)</span>`
            : `<span class="badge" style="background: rgba(100, 116, 139, 0.15); color: #94A3B8; font-size: 11px;">Trượt (${lotCount}s)</span>`;

        tr.innerHTML = `
            <td style="text-align: center; color: var(--text-muted); font-size: 11px;">${r.stt || idx + 1}</td>
            <td style="font-weight: 700; color: #E2E8F0; font-size: 12px;">${r.date}</td>
            <td style="text-align: center;">
                <span class="badge badge-gold" style="font-size: 15px; font-weight: 900; padding: 2px 8px; font-family: 'JetBrains Mono', monospace;">
                    ${r.de}
                </span>
            </td>
            <td style="text-align: center; font-size: 13px; font-family: 'JetBrains Mono', monospace;">
                ${top1Badge}
            </td>
            <td>
                <div style="display: flex; gap: 3px; flex-wrap: wrap; align-items: center;">
                    ${top4Badges || '<span style="color: #64748B;">---</span>'}
                </div>
            </td>
            <td style="text-align: center;">
                ${cangStatus}
            </td>
            <td>
                <div style="display: flex; gap: 2px; flex-wrap: wrap; align-items: center; max-width: 200px;">
                    ${d9Badges || '<span style="color: #64748B;">---</span>'}
                </div>
            </td>
            <td style="text-align: center;">
                ${lotStatus}
            </td>
        `;
        tbody.appendChild(tr);
    });

    window.currentRadarHistoryText = filtered.map(r => `${r.date} | Đề: ${r.de} (3D: ${r.actual_3d}) | Top 1: ${r.top_1} (${r.hit_top_1 ? 'TRÚNG' : 'TRƯỢT'}) | Top 4: ${(r.top_4||[]).join(',')} (${r.hit_top_4 ? 'TRÚNG' : 'TRƯỢT'}) | 3 Càng: (${r.hit_cang_tt ? 'TRÚNG 3D' : 'TRƯỢT'}) | Dàn 9s: ${(r.dan_9_so||[]).join(',')} (${r.hit_dan_9 ? 'TRÚNG' : 'TRƯỢT'})`).join('\n');
}

function setupRadarEventListeners() {
    // Refresh Button
    document.getElementById('btnRefreshRadar')?.addEventListener('click', async () => {
        showToast('🔄 Đang làm mới dữ liệu Radar...', 'warn');
        await fetchAndRenderRadarLive();
        showToast('✅ Đã cập nhật kết quả Radar mới nhất!', 'success');
    });

    // Toggle Polling
    document.getElementById('btnToggleRadarPolling')?.addEventListener('click', () => {
        isRadarPollingActive = !isRadarPollingActive;
        const lbl = document.getElementById('lblToggleText');
        const badge = document.getElementById('radarLiveBadgeTxt');
        if (lbl) lbl.textContent = `Tự Động Quét: ${isRadarPollingActive ? 'BẬT' : 'TẮT'}`;
        if (badge) badge.textContent = isRadarPollingActive ? 'ĐANG THEO DÕI LIVE (5s/lần)' : 'TẠM DỪNG QUÉT';
        showToast(isRadarPollingActive ? '🟢 Đã kích hoạt tự động quét live 5s/lần' : '⏸️ Đã tạm dừng tự động quét', 'info');
    });

    // Copy Bạch Thủ
    document.getElementById('btnCopyRadarBT')?.addEventListener('click', () => {
        copyToClipboard(window.currentRadarBT || '41', 'Đã copy Bạch Thủ: ' + (window.currentRadarBT || '41'));
    });

    // Copy Song Thủ Trụ (Bạch Thủ + Lót Lộn)
    document.getElementById('btnCopyRadarST')?.addEventListener('click', () => {
        copyToClipboard(window.currentRadarST || '', 'Đã copy Cặp Song Thủ Trụ: ' + (window.currentRadarST || ''));
    });

    // Copy Tứ Thủ
    document.getElementById('btnCopyRadarTT')?.addEventListener('click', () => {
        copyToClipboard(window.currentRadarTT || '', 'Đã copy Tứ Thủ: ' + (window.currentRadarTT || ''));
    });

    // Copy 3 Càng Bạch Thủ
    document.getElementById('btnCopyCangBT')?.addEventListener('click', () => {
        copyToClipboard(window.currentCangBT || '', 'Đã copy 3 Càng Bạch Thủ: ' + (window.currentCangBT || ''));
    });

    // Copy 3 Càng Tứ Thủ (12 Con)
    document.getElementById('btnCopyCangTT')?.addEventListener('click', () => {
        copyToClipboard(window.currentCangTT || '', 'Đã copy 12 Con 3 Càng Tứ Thủ!');
    });

    // Copy 3 Càng Cội Nguồn (27 Con)
    document.getElementById('btnCopyCangDan9')?.addEventListener('click', () => {
        copyToClipboard(window.currentCangD9 || '', 'Đã copy 27 Con 3 Càng Cội Nguồn!');
    });

    // Nút Chốt Gấp Trước 18h25 (1 Chạm)
    document.getElementById('btnQuickCopyAll')?.addEventListener('click', () => {
        const text = `⚡ GÓI CHỐT GẤP XSMB LIVE (TRƯỚC 18H25):\n👑 BẠCH THỦ: ${window.currentRadarBT || ''}\n🛡️ LÓT LỘN TRỤ: ${window.currentRadarLotLon || ''} (Cặp Song Thủ: ${window.currentRadarST || ''})\n🔥 TỨ THỦ: ${window.currentRadarTT || ''}\n🌟 3 CÀNG BẠCH THỦ (3s): ${window.currentCangBT || ''}\n🌟 3 CÀNG TỨ THỦ (12s): ${window.currentCangTT || ''}\n🎯 DÀN 9S CỘI NGUỒN: ${window.currentRadarDan9 || ''}\n🛡️ DÀN LÓT BẢO HIỂM: ${window.currentRadarLot || ''}`;
        copyToClipboard(text, '⚡ Đã copy GÓI CHỐT GẤP (Bạch Thủ + Lót Lộn + Tứ Thủ + 3 Càng + 9s) sẵn sàng dán tin nhắn!');
    });

    // Copy Dàn Cội Nguồn: Gốc (9s), Đảo (8s), Tất Cả (17s)
    document.getElementById('btnCopyDan9Goc')?.addEventListener('click', () => {
        copyToClipboard(window.currentRadarDan9Goc || '', 'Đã copy Dàn Gốc (9 Số): ' + (window.currentRadarDan9Goc || ''));
    });

    document.getElementById('btnCopyDan9Dao')?.addEventListener('click', () => {
        copyToClipboard(window.currentRadarDan9Dao || '', 'Đã copy Dàn Đảo Bảo Hiểm (8 Số): ' + (window.currentRadarDan9Dao || ''));
    });

    document.getElementById('btnCopyRadarDan9')?.addEventListener('click', () => {
        copyToClipboard(window.currentRadarDan9All || window.currentRadarDan9 || '', 'Đã copy Toàn Bộ Dàn Cội Nguồn & Đảo (17 Số)!');
    });

    // Copy Dàn Lót
    document.getElementById('btnCopyRadarLot')?.addEventListener('click', () => {
        copyToClipboard(window.currentRadarLot || '', 'Đã copy Dàn Lót Hợp Lệ!');
    });

    // Copy All Table
    document.getElementById('btnCopyTableAll')?.addEventListener('click', () => {
        copyToClipboard(window.currentRadarTableText || '', 'Đã copy Danh Sách Bảng Phân Tầng 5 Cột!');
    });

    // Copy Frame N1, N2, N3
    document.getElementById('btnCopyFrameN1')?.addEventListener('click', () => {
        copyToClipboard(window.currentRadarFrameN1 || '', 'Đã copy Dàn 60 Số N1!');
    });
    document.getElementById('btnCopyFrameN2')?.addEventListener('click', () => {
        copyToClipboard(window.currentRadarFrameN2 || '', 'Đã copy Dàn Siêu Lọc 36 Số N2!');
    });
    document.getElementById('btnCopyFrameN3')?.addEventListener('click', () => {
        copyToClipboard(window.currentRadarFrameN3 || '', 'Đã copy Dàn Hỏa Lực 36 Số N3!');
    });

    // Copy Radar History Table
    document.getElementById('btnCopyRadarHistory')?.addEventListener('click', () => {
        copyToClipboard(window.currentRadarHistoryText || '', 'Đã copy Lịch Sử Kiểm Chứng Các Kỳ Radar Live!');
    });

    // Filter Buttons for 5-col table
    document.querySelectorAll('#radarTableFilterBar .table-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#radarTableFilterBar .table-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRadarTableFilter = btn.getAttribute('data-filter') || 'all';
            renderRadar5ColTable();
        });
    });

    // Filter Buttons for Radar History table
    document.querySelectorAll('#radarHistoryFilterBar .table-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#radarHistoryFilterBar .table-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRadarHistoryFilter = btn.getAttribute('data-filter') || 'all';
            renderRadarHistoryTable();
        });
    });
}

/* ==========================================================================
   TAB 4: LOGIC CẦU ĐỘNG AI & ĐỐI CHIẾU DÀN TĨNH 60S (TỰ ĐỘNG HÓA AI)
   ========================================================================== */

let tab4Data = null;
let tab4CompareData = null;

async function initTabCauDong() {
    setupTabCauDongEventListeners();
    await loadTabCauDongData(true);
}

async function loadTabCauDongData(isSilent = false) {
    try {
        const [tab4Res, compRes] = await Promise.allSettled([
            fetch('tab4_data.json?t=' + Date.now(), { cache: 'no-store' }),
            fetch('so_sanh_dan.json?t=' + Date.now(), { cache: 'no-store' })
        ]);

        if (tab4Res.status === 'fulfilled' && tab4Res.value.ok) {
            tab4Data = await tab4Res.value.json();
        }
        if (compRes.status === 'fulfilled' && compRes.value.ok) {
            tab4CompareData = await compRes.value.json();
        }

        renderTabCauDong();
    } catch (err) {
        console.warn('Lỗi tải dữ liệu Tab 4 Cầu Động:', err);
        if (!isSilent) showToast('⚠️ Không thể tải dữ liệu Cầu Động AI: ' + err.message, 'error');
    }
}

function renderTabCauDong() {
    if (!tab4Data) return;

    // Lấy bản ghi mới nhất (ưu tiên trường latest hoặc phần tử đầu tiên của lich_su)
    const latest = tab4Data.latest || (tab4Data.lich_su && tab4Data.lich_su.length > 0 ? tab4Data.lich_su[0] : null);
    if (!latest) return;

    const ngay = latest.ngay || '--';
    const danDong = latest.dan_cau_dong || [];
    const dan60s = latest.dan_60s || [];
    const giaoThoa = latest.giao_thoa || [];
    const ngoai = latest.ngoai || [];
    const bt = latest.bach_thu || '--';
    const lotLon = bt && bt.length === 2 && bt[0] !== bt[1] ? (bt[1] + bt[0]) : (bt ? bt : '--');
    const tuThu = latest.tu_thu || [];
    const dan9 = latest.dan_9 || [];
    const danDao = latest.dan_dao || [];
    const canhBao = latest.canh_bao || { canh_bao: false };
    const cauChay = latest.cau_chay || [];

    // Lưu biến toàn cục hỗ trợ Copy
    window.cauDongBT = bt;
    window.cauDongLotLon = lotLon;
    window.cauDongTT = tuThu.join(' ');
    window.cauDongDan9 = dan9.join(' ');
    window.cauDongDanDao = danDao.join(' ');
    window.cauDongGiaoThoa = giaoThoa.join(' ');
    window.cauDongNgoai = ngoai.join(' ');
    window.cauDongAllPackage = `⚡ GÓI CHỐT CẦU ĐỘNG XSMB AI (${ngay}):\n👑 Bạch Thủ: ${bt} (Lót lộn: ${lotLon})\n🔥 Tứ Thủ: ${tuThu.join(', ')}\n⭐ Dàn 9 Số Cội Nguồn: ${dan9.join(', ')}\n🔄 Dàn Đảo Bảo Hiểm: ${danDao.join(', ')}\n🎯 Dàn Giao Thoa 60s N1 (${giaoThoa.length}s): ${giaoThoa.join(' ')}\n🛡️ Cảnh báo chu kỳ: ${canhBao.canh_bao ? 'NGUY CƠ GÃY (>=4d)' : 'AN TOÀN (2-3d)'}`;

    // 1. RENDER HEADER & KPIS
    const lblDate = document.getElementById('lblTab4Date');
    if (lblDate) lblDate.textContent = ngay;

    const kpiBtTt = document.getElementById('kpiCauDongBtTt');
    if (kpiBtTt) kpiBtTt.textContent = `${bt} • ${tuThu.slice(0, 3).join(',')}`;

    const kpiSize = document.getElementById('kpiCauDongSize');
    if (kpiSize) kpiSize.textContent = `${danDong.length} Số (G1→G5.6)`;

    const kpiTrung = document.getElementById('kpiCauDongTrung');
    if (kpiTrung) {
        const pct = danDong.length > 0 ? ((giaoThoa.length / danDong.length) * 100).toFixed(1) : '0';
        kpiTrung.textContent = `${giaoThoa.length} Số (${pct}%)`;
    }

    const kpiTrangThai = document.getElementById('kpiCauDongTrangThai');
    if (kpiTrangThai) {
        if (canhBao.canh_bao) {
            kpiTrangThai.textContent = `⚠️ NGUY CƠ GÃY (≥4d)`;
            kpiTrangThai.style.color = '#F43F5E';
        } else {
            kpiTrangThai.textContent = `🛡️ AN TOÀN (${canhBao.so_ngay_max || 3}d)`;
            kpiTrangThai.style.color = '#34D399';
        }
    }

    // Lấy đề kỳ hiện tại nếu đã xổ
    const todayDe = latest.de_ve || latest.de || (appData && appData.today_de) || '';
    const hasTodayResult = todayDe && todayDe !== '--';

    // 2. RENDER BỘ SỐ DỰ ĐOÁN
    const elBt = document.getElementById('cauDongTop1');
    if (elBt) {
        elBt.textContent = bt;
        if (hasTodayResult && bt === todayDe) {
            elBt.classList.add('badge-hit-explode');
        } else {
            elBt.classList.remove('badge-hit-explode');
        }
    }

    const elLot = document.getElementById('cauDongLotLon');
    if (elLot) {
        const isLotHit = hasTodayResult && lotLon === todayDe;
        elLot.innerHTML = `Lót lộn: <strong style="color: ${isLotHit ? '#34D399' : '#34D399'}; font-size: 15px; font-family: 'JetBrains Mono', monospace;">${lotLon}</strong> ${isLotHit ? '<span class="badge badge-hit-explode" style="font-size: 10px; padding: 1px 4px;">🎯 NỔ LỘN</span>' : ''}`;
    }

    // Tứ Thủ Chips (Làm nổi bật con nổ)
    const elTop4 = document.getElementById('cauDongTop4Chips');
    if (elTop4) {
        elTop4.innerHTML = '';
        if (tuThu.length > 0) {
            tuThu.forEach(s => {
                const sp = document.createElement('span');
                const isHit = hasTodayResult && s === todayDe;
                const isDao = hasTodayResult && !isHit && (todayDe.length === 2 && todayDe[1] + todayDe[0] === s);
                if (isHit) {
                    sp.className = 'badge badge-hit-explode';
                    sp.style.cssText = 'font-weight: 900; font-size: 14px; padding: 4px 10px; font-family: "JetBrains Mono", monospace; border-radius: 6px;';
                    sp.textContent = `🎯 ${s}`;
                } else if (isDao) {
                    sp.className = 'badge';
                    sp.style.cssText = 'background: rgba(56, 189, 248, 0.25); color: #38BDF8; font-weight: 800; font-size: 13px; padding: 4px 8px; border: 1px solid #38BDF8; font-family: "JetBrains Mono", monospace; border-radius: 6px;';
                    sp.textContent = `🔄 ${s}`;
                } else {
                    sp.className = 'badge';
                    sp.style.cssText = 'background: rgba(56, 189, 248, 0.2); color: #38BDF8; font-weight: 800; font-size: 14px; padding: 4px 10px; border: 1px solid rgba(56, 189, 248, 0.4); font-family: "JetBrains Mono", monospace; border-radius: 6px;';
                    sp.textContent = s;
                }
                elTop4.appendChild(sp);
            });
        } else {
            elTop4.innerHTML = '<span style="color: #64748B;">Đang cập nhật...</span>';
        }
    }

    // Dàn 9 Số Chips (Làm nổi bật con nổ)
    const elDan9 = document.getElementById('cauDongDan9Chips');
    const lblCountDan9 = document.getElementById('lblCountDan9CauDong');
    if (lblCountDan9) lblCountDan9.textContent = `${dan9.length} Số`;
    if (elDan9) {
        elDan9.innerHTML = '';
        dan9.forEach(s => {
            const sp = document.createElement('span');
            const isHit = hasTodayResult && s === todayDe;
            const isDao = hasTodayResult && !isHit && (todayDe.length === 2 && todayDe[1] + todayDe[0] === s);
            if (isHit) {
                sp.className = 'badge badge-hit-explode';
                sp.style.cssText = 'font-weight: 900; font-size: 13.5px; padding: 3px 8px; font-family: "JetBrains Mono", monospace; border-radius: 5px;';
                sp.textContent = `🎯 ${s}`;
            } else if (isDao) {
                sp.className = 'badge';
                sp.style.cssText = 'background: rgba(56, 189, 248, 0.25); color: #38BDF8; font-weight: 800; font-size: 12px; padding: 2px 6px; border: 1px solid #38BDF8; font-family: "JetBrains Mono", monospace; border-radius: 5px;';
                sp.textContent = `🔄 ${s}`;
            } else {
                sp.className = 'badge badge-gold';
                sp.style.cssText = 'font-weight: 800; font-size: 13px; padding: 3px 8px; font-family: "JetBrains Mono", monospace; border-radius: 5px;';
                sp.textContent = s;
            }
            elDan9.appendChild(sp);
        });
    }

    // Dàn Đảo Chips (Làm nổi bật con nổ)
    const elDanDao = document.getElementById('cauDongDanDaoChips');
    const lblCountDanDao = document.getElementById('lblCountDanDaoCauDong');
    if (lblCountDanDao) lblCountDanDao.textContent = `${danDao.length} Số`;
    if (elDanDao) {
        elDanDao.innerHTML = '';
        danDao.forEach(s => {
            const sp = document.createElement('span');
            const isHit = hasTodayResult && s === todayDe;
            if (isHit) {
                sp.className = 'badge badge-hit-explode';
                sp.style.cssText = 'font-weight: 900; font-size: 13px; padding: 3px 8px; font-family: "JetBrains Mono", monospace; border-radius: 5px;';
                sp.textContent = `🎯 ${s}`;
            } else {
                sp.className = 'badge';
                sp.style.cssText = 'background: rgba(148, 163, 184, 0.2); color: #E2E8F0; font-weight: 800; font-size: 13px; padding: 3px 8px; font-family: "JetBrains Mono", monospace; border-radius: 5px; border: 1px solid rgba(148, 163, 184, 0.3);';
                sp.textContent = s;
            }
            elDanDao.appendChild(sp);
        });
    }

    // 3. RENDER CẢNH BÁO 4D+
    const boxCanhBao = document.getElementById('boxCanhBaoCau4d');
    const iconCanhBao = document.getElementById('iconCanhBao');
    const txtCanhBao = document.getElementById('txtCanhBao');
    const badgeCanhBao = document.getElementById('badgeCanhBao');
    if (boxCanhBao && txtCanhBao && badgeCanhBao) {
        if (canhBao.canh_bao) {
            boxCanhBao.style.background = 'rgba(239, 68, 68, 0.12)';
            boxCanhBao.style.borderColor = 'rgba(239, 68, 68, 0.4)';
            if (iconCanhBao) {
                iconCanhBao.className = 'fa-solid fa-triangle-exclamation';
                iconCanhBao.style.color = '#F43F5E';
            }
            txtCanhBao.textContent = canhBao.ly_do || 'Cầu chạy ≥ 4 ngày: Nguy cơ gãy cao, chuyển ưu tiên lót lộn và tứ thủ!';
            txtCanhBao.style.color = '#FCA5A5';
            badgeCanhBao.textContent = 'NGUY CƠ GÃY';
            badgeCanhBao.style.background = 'rgba(239, 68, 68, 0.25)';
            badgeCanhBao.style.color = '#F87171';
            badgeCanhBao.style.borderColor = '#EF4444';
        } else {
            boxCanhBao.style.background = 'rgba(16, 185, 129, 0.1)';
            boxCanhBao.style.borderColor = 'rgba(16, 185, 129, 0.3)';
            if (iconCanhBao) {
                iconCanhBao.className = 'fa-solid fa-shield-halved';
                iconCanhBao.style.color = '#34D399';
            }
            txtCanhBao.textContent = `Cầu đang trong chu kỳ vàng an toàn (${canhBao.so_ngay_max || 3} ngày) • Tỷ lệ nổ ổn định`;
            txtCanhBao.style.color = '#E2E8F0';
            badgeCanhBao.textContent = 'AN TOÀN';
            badgeCanhBao.style.background = 'rgba(16, 185, 129, 0.2)';
            badgeCanhBao.style.color = '#34D399';
            badgeCanhBao.style.borderColor = '#10B981';
        }
    }

    // 4. RENDER DÀN GIAO THOA & NGOÀI 60S (Làm nổi bật con nổ)
    const lblCountGiaoThoa = document.getElementById('lblCountGiaoThoa');
    if (lblCountGiaoThoa) lblCountGiaoThoa.textContent = `${giaoThoa.length} Số`;
    const gridGiaoThoa = document.getElementById('gridGiaoThoa');
    if (gridGiaoThoa) {
        gridGiaoThoa.innerHTML = '';
        giaoThoa.forEach(num => {
            const div = document.createElement('div');
            const isHit = hasTodayResult && num === todayDe;
            div.className = isHit ? 'num-tag hit-explode' : 'num-tag gold';
            div.textContent = isHit ? `🎯 ${num}` : num;
            gridGiaoThoa.appendChild(div);
        });
    }

    const lblCountNgoai = document.getElementById('lblCountNgoai');
    if (lblCountNgoai) lblCountNgoai.textContent = `${ngoai.length} Số`;
    const gridNgoai = document.getElementById('gridNgoai');
    if (gridNgoai) {
        gridNgoai.innerHTML = '';
        ngoai.forEach(num => {
            const div = document.createElement('div');
            const isHit = hasTodayResult && num === todayDe;
            div.className = isHit ? 'num-tag hit-explode' : 'num-tag gray';
            div.textContent = isHit ? `🎯 ${num}` : num;
            gridNgoai.appendChild(div);
        });
    }

    // 5. RENDER BẢNG VỊ TRÍ CẦU CHẠY MẠNH
    renderCauDongPositionsTable(cauChay);

    // 6. RENDER BẢNG NHẬT KÝ SO SÁNH QUA CÁC KỲ
    renderCauDongHistoryTable();
}

function renderCauDongPositionsTable(cauChay) {
    const tbody = document.getElementById('tbodyCauDongPositions');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!cauChay || cauChay.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 18px;">Không có vị trí cầu nào đạt ngưỡng chạy mạnh</td></tr>`;
        return;
    }

    const listLines = [];
    cauChay.forEach((c, idx) => {
        const tr = document.createElement('tr');
        const posFormatted = c.vi_tri.toUpperCase().replace(/\./g, '_');
        const soNgay = c.so_ngay || 2;
        let danhGiaTag = '';
        if (soNgay >= 4) {
            danhGiaTag = `<span class="badge" style="background: rgba(239, 68, 68, 0.2); color: #F87171; border: 1px solid #EF4444; font-weight: 700;">⚠️ Cảnh báo gãy (≥4d)</span>`;
        } else if (soNgay === 3) {
            danhGiaTag = `<span class="badge badge-gold" style="font-weight: 800; font-size: 11px;">⭐ Chu kỳ vàng (3d)</span>`;
        } else {
            danhGiaTag = `<span class="badge" style="background: rgba(56, 189, 248, 0.2); color: #38BDF8; border: 1px solid rgba(56, 189, 248, 0.4); font-weight: 700;">Đang chạy (2d)</span>`;
        }

        tr.innerHTML = `
            <td style="text-align: center; color: var(--text-muted); font-size: 12px;">${idx + 1}</td>
            <td style="font-weight: 700; color: #E2E8F0; font-family: 'JetBrains Mono', monospace;">
                <i class="fa-solid fa-crosshairs" style="color: #FBBF24; margin-right: 6px; font-size: 11px;"></i>${posFormatted}
            </td>
            <td style="text-align: center;">
                <span class="badge badge-gold" style="font-size: 14px; font-weight: 900; padding: 2px 8px; font-family: 'JetBrains Mono', monospace;">
                    ${c.chu_so}
                </span>
            </td>
            <td style="text-align: center; font-weight: 800; color: #38BDF8; font-family: 'JetBrains Mono', monospace;">
                ${soNgay} ngày
            </td>
            <td style="text-align: center; font-weight: 800; color: #34D399; font-family: 'JetBrains Mono', monospace;">
                ${c.diem}đ
            </td>
            <td>
                ${danhGiaTag}
            </td>
        `;
        tbody.appendChild(tr);
        listLines.push(`#${idx + 1} Vị trí: ${posFormatted} | Ký số: ${c.chu_so} | Chu kỳ: ${soNgay} ngày | Điểm: ${c.diem}`);
    });

    window.cauDongPositionsText = listLines.join('\n');
}

function renderCauDongHistoryTable() {
    const tbody = document.getElementById('tbodyCauDongHistory');
    if (!tbody) return;
    tbody.innerHTML = '';

    const list = (tab4Data && tab4Data.lich_su) ? tab4Data.lich_su : [];
    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--text-muted); padding: 18px;">Chưa có dữ liệu nhật ký so sánh</td></tr>`;
        return;
    }

    const rows = [...list];
    const historyLines = [];

    rows.forEach((item, idx) => {
        const tr = document.createElement('tr');
        const ngay = item.ngay || '--';
        const dDong = (item.dan_cau_dong || []).length || (item.so_sanh ? item.so_sanh.dan_dong_size : 64);
        const d60 = (item.dan_60s || []).length || (item.so_sanh ? item.so_sanh.dan_tinh_size : 61);
        const trung = (item.giao_thoa || []).length || (item.so_sanh ? item.so_sanh.trung_size : 38);
        const pct = (item.so_sanh && item.so_sanh.ty_le_trung) ? item.so_sanh.ty_le_trung : (dDong > 0 ? ((trung / dDong) * 100).toFixed(1) : '59.4');
        const bt = item.bach_thu || '--';
        const tuThuRaw = Array.isArray(item.tu_thu) ? item.tu_thu : (typeof item.tu_thu === 'string' ? item.tu_thu.split(/[\s,]+/).filter(Boolean) : []);
        const dan9Raw = Array.isArray(item.dan_9) ? item.dan_9 : (typeof item.dan_9 === 'string' ? item.dan_9.split(/[\s,]+/).filter(Boolean) : []);
        const deVe = item.de_ve || item.de || '--';
        const hasResult = deVe && deVe !== '--';

        // 1. CỘT BẠCH THỦ (Làm nổi bật nếu nổ)
        let btHtml = '';
        if (hasResult) {
            if (bt === deVe) {
                btHtml = `<span class="badge badge-hit-explode" style="font-size: 13.5px; padding: 2px 8px; font-family: 'JetBrains Mono', monospace;">🎯 ${bt}</span>`;
            } else if (deVe.length === 2 && deVe[1] + deVe[0] === bt) {
                btHtml = `<span class="badge" style="background: rgba(56, 189, 248, 0.25); color: #38BDF8; font-weight: 800; border: 1.5px solid #38BDF8; font-size: 12px; padding: 2px 6px; font-family: 'JetBrains Mono', monospace;" title="Trúng số lộn">🔄 ${bt}</span>`;
            } else {
                btHtml = `<span style="color: #64748B; font-family: 'JetBrains Mono', monospace; font-size: 12px;">${bt}</span>`;
            }
        } else {
            btHtml = `<span class="badge badge-gold" style="font-size: 13px; font-weight: 800; font-family: 'JetBrains Mono', monospace;">${bt}</span>`;
        }

        // 2. CỘT TỨ THỦ (Trúng ở vị trí nào nổi ở vị trí đó)
        let tuThuHtml = '---';
        if (tuThuRaw.length > 0) {
            tuThuHtml = tuThuRaw.map(num => {
                if (hasResult && num === deVe) {
                    return `<span class="badge badge-hit-explode" style="font-size: 12.5px; padding: 2px 7px; margin: 1px; font-family: 'JetBrains Mono', monospace;">🎯 ${num}</span>`;
                } else if (hasResult && deVe.length === 2 && deVe[1] + deVe[0] === num) {
                    return `<span class="badge" style="background: rgba(56, 189, 248, 0.25); color: #38BDF8; font-weight: 800; border: 1px solid #38BDF8; padding: 2px 6px; font-size: 11px; margin: 1px; font-family: 'JetBrains Mono', monospace;">🔄 ${num}</span>`;
                } else if (hasResult) {
                    return `<span style="color: #64748B; font-family: 'JetBrains Mono', monospace; font-size: 12px; margin: 0 3px;">${num}</span>`;
                } else {
                    return `<span class="badge" style="background: rgba(56, 189, 248, 0.15); color: #38BDF8; padding: 2px 6px; font-size: 11.5px; margin: 1px; font-family: 'JetBrains Mono', monospace;">${num}</span>`;
                }
            }).join(' ');
        }

        // 3. CỘT DÀN 9 SỐ (Trúng ở vị trí nào nổi ở vị trí đó)
        let dan9Html = '---';
        if (dan9Raw.length > 0) {
            dan9Html = dan9Raw.map(num => {
                if (hasResult && num === deVe) {
                    return `<span class="badge badge-hit-explode" style="font-size: 12px; padding: 2px 6px; margin: 1px; font-family: 'JetBrains Mono', monospace;">🎯 ${num}</span>`;
                } else if (hasResult && deVe.length === 2 && deVe[1] + deVe[0] === num) {
                    return `<span class="badge" style="background: rgba(56, 189, 248, 0.25); color: #38BDF8; font-weight: 800; border: 1px solid #38BDF8; padding: 1px 4px; font-size: 10.5px; margin: 1px; font-family: 'JetBrains Mono', monospace;">🔄 ${num}</span>`;
                } else if (hasResult) {
                    return `<span style="color: #64748B; font-family: 'JetBrains Mono', monospace; font-size: 11px; margin: 0 1px;">${num}</span>`;
                } else {
                    return `<span style="color: #FDE68A; font-family: 'JetBrains Mono', monospace; font-size: 11.5px; margin: 0 2px;">${num}</span>`;
                }
            }).join(' ');
        }

        // 4. CỘT TRÙNG KHỚP
        let trungHtml = '';
        const isHitAny = item.hit_top_1 || item.hit_top_4 || item.hit_dan_9 || bt === deVe || tuThuRaw.includes(deVe) || dan9Raw.includes(deVe);
        if (hasResult) {
            if (isHitAny) {
                trungHtml = `<span class="badge" style="background: rgba(16, 185, 129, 0.25); color: #34D399; font-weight: 800; border: 1px solid #10B981; font-family: 'JetBrains Mono', monospace; font-size: 11px; padding: 2px 6px;">🎯 Trúng (${trung}s)</span>`;
            } else {
                trungHtml = `<span style="color: #64748B; font-size: 11.5px; font-family: 'JetBrains Mono', monospace;">Trượt (${trung}s)</span>`;
            }
        } else {
            trungHtml = `<span style="color: #34D399; font-weight: 900; font-family: 'JetBrains Mono', monospace;">${trung} số</span>`;
        }

        tr.innerHTML = `
            <td style="text-align: center; color: var(--text-muted); font-size: 11px;">${idx + 1}</td>
            <td style="font-weight: 700; color: #E2E8F0; font-size: 12px;">${ngay}</td>
            <td style="text-align: center;">
                <span class="badge ${deVe !== '--' ? 'badge-gold' : ''}" style="font-size: 14px; font-weight: 900; font-family: 'JetBrains Mono', monospace;">
                    ${deVe}
                </span>
            </td>
            <td style="text-align: center; color: #38BDF8; font-weight: 700; font-family: 'JetBrains Mono', monospace;">
                ${dDong} số
            </td>
            <td style="text-align: center; color: #94A3B8; font-weight: 700; font-family: 'JetBrains Mono', monospace;">
                ${d60} số
            </td>
            <td style="text-align: center;">
                ${trungHtml}
            </td>
            <td style="text-align: center;">
                <span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #34D399; font-weight: 800; border: 1px solid #10B981;">
                    ${pct}%
                </span>
            </td>
            <td style="text-align: center;">
                ${btHtml}
            </td>
            <td style="font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #38BDF8;">
                <div style="display: flex; gap: 3px; flex-wrap: wrap; align-items: center;">
                    ${tuThuHtml}
                </div>
            </td>
            <td style="font-family: 'JetBrains Mono', monospace; font-size: 11.5px; color: #FDE68A;">
                <div style="display: flex; gap: 2px; flex-wrap: wrap; align-items: center; max-width: 220px;">
                    ${dan9Html}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
        historyLines.push(`${ngay} | Đề: ${deVe} | Cầu Động: ${dDong}s | 60s N1: ${d60}s | Trùng: ${trung}s (${pct}%) | BT: ${bt} | TT: ${tuThuRaw.join(',')} | Dàn 9s: ${dan9Raw.join(',')}`);
    });

    window.cauDongHistoryText = historyLines.join('\n');
}

function setupTabCauDongEventListeners() {
    // Copy Bạch Thủ
    document.getElementById('btnCopyCauDongBT')?.addEventListener('click', () => {
        copyToClipboard(window.cauDongBT || '', 'Đã copy Bạch Thủ Cầu Động: ' + (window.cauDongBT || ''));
    });

    // Copy Tứ Thủ
    document.getElementById('btnCopyCauDongTT')?.addEventListener('click', () => {
        copyToClipboard(window.cauDongTT || '', 'Đã copy Tứ Thủ Cầu Động: ' + (window.cauDongTT || ''));
    });

    // Copy Dàn 9 Số
    document.getElementById('btnCopyCauDongDan9')?.addEventListener('click', () => {
        copyToClipboard(window.cauDongDan9 || '', 'Đã copy Dàn 9 Số Cội Nguồn Cầu Động!');
    });

    // Copy Dàn Đảo
    document.getElementById('btnCopyCauDongDanDao')?.addEventListener('click', () => {
        copyToClipboard(window.cauDongDanDao || '', 'Đã copy Dàn Đảo Bảo Hiểm Cầu Động!');
    });

    // Copy Toàn Bộ Gói Chốt Cầu Động
    document.getElementById('btnCopyCauDongAll')?.addEventListener('click', () => {
        copyToClipboard(window.cauDongAllPackage || '', '⚡ Đã copy toàn bộ Gói Chốt Cầu Động AI!');
    });

    // Copy Dàn Giao Thoa
    document.getElementById('btnCopyCauDongGiaoThoa')?.addEventListener('click', () => {
        copyToClipboard(window.cauDongGiaoThoa || '', 'Đã copy Dàn Giao Thoa Với 60s N1: ' + (window.cauDongGiaoThoa || ''));
    });

    // Copy Dàn Ngoài
    document.getElementById('btnCopyCauDongNgoai')?.addEventListener('click', () => {
        copyToClipboard(window.cauDongNgoai || '', 'Đã copy Dàn Ngoài 60s N1: ' + (window.cauDongNgoai || ''));
    });

    // Copy Danh Sách Vị Trí Cầu
    document.getElementById('btnCopyCauDongViTri')?.addEventListener('click', () => {
        copyToClipboard(window.cauDongPositionsText || '', 'Đã copy Danh Sách Vị Trí Cầu Đang Chạy!');
    });

    // Copy Lịch Sử So Sánh
    document.getElementById('btnCopyCauDongHistory')?.addEventListener('click', () => {
        copyToClipboard(window.cauDongHistoryText || '', 'Đã copy Nhật Ký So Sánh Dàn Qua Các Kỳ!');
    });
}


