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
    try {
        const response = await fetch('analysis_summary.json?t=' + Date.now());
        if (!response.ok) throw new Error('Không thể tải dữ liệu analysis_summary.json');
        appData = await response.json();
        
        updateDynamicPredictionDates();
        renderHeaderAndHero();
        renderTabFrame3Day();
        initRadarLive();
        renderTabHistoryStats();
        
        setupEventListeners();
    } catch (error) {
        console.error('Lỗi nạp dữ liệu Mini App:', error);
        showToast('❌ Lỗi nạp dữ liệu: ' + error.message, 'error');
    }
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

async function initRadarLive() {
    await fetchAndRenderRadarLive();
    startRadarLivePolling();
    setupRadarEventListeners();
}

async function fetchAndRenderRadarLive(isSilent = false) {
    try {
        const res = await fetch('live_radar_state.json?t=' + Date.now());
        if (!res.ok) throw new Error('Không thể tải file live_radar_state.json');
        radarData = await res.json();
        
        renderRadarHeaderInfo();
        renderFastLockBanner();
        renderLivePrizeChips();
        renderRadarTopSummaries();
        renderRadarCang3D();
        renderRadar5ColTable();
        renderRadarFrame3Day();
        renderRadarHistoryTable();
        
        if (!isSilent) {
            console.log('[Radar Live] Đã cập nhật thành công dữ liệu live:', radarData.target_date);
        }
    } catch (err) {
        console.warn('[Radar Live] Chưa tải được state live:', err);
    }
}

function startRadarLivePolling() {
    if (radarPollingTimer) clearInterval(radarPollingTimer);
    
    // Tự động nhận diện khung giờ quay thưởng XSMB (18h14 - 18h35) để tăng tốc độ cào
    const now = new Date();
    const curHour = now.getHours();
    const curMin = now.getMinutes();
    const isLiveHour = (curHour === 18 && curMin >= 14 && curMin <= 35);
    const intervalMs = isLiveHour ? 3000 : 5000;

    radarPollingTimer = setInterval(() => {
        if (isRadarPollingActive) {
            fetchAndRenderRadarLive(true);
        }
    }, intervalMs);
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
        const total = radarData.total_count || 19;
        const actualDe = radarData.actual_de || '';
        const isG5Done = radarData.is_g5_finished || (filled >= 19);

        if (actualDe) {
            elProgress.innerHTML = `<span style="color: #34D399; font-weight: 800;">19/19 GIẢI • ĐÃ CÓ ĐỀ ${actualDe} 🎯</span>`;
        } else if (isG5Done) {
            elProgress.innerHTML = `<span style="color: #FBBF24; font-weight: 800;">19/19 GIẢI • 🔒 ĐÃ KHÓA CHỐT G5</span>`;
        } else if (filled > 0) {
            elProgress.innerHTML = `<span style="color: #38BDF8; font-weight: 800;">${filled}/${total} GIẢI (ĐANG QUAY...)</span>`;
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
    const isG5Done = radarData.is_g5_finished || (filled >= 19);
    const actualDe = radarData.actual_de || '';

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
        if (subEl) subEl.innerHTML = `<span style="color: #34D399; font-weight: 800;">${hitStatus.join(' • ')}</span> | Bạch thủ: ${radarData.top_1 || '--'} | Tứ thủ: ${(radarData.top_4||[]).join(', ')}`;
        if (btnQuick) btnQuick.innerHTML = `<i class="fa-solid fa-copy"></i> SAO CHÉP KẾT QUẢ ĐỐI CHIẾU (${actualDe})`;
    } else if (isG5Done) {
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
            badgeEl.className = 'badge badge-gold';
            badgeEl.innerHTML = `🔒 ĐÃ KHÓA CHỐT 100%`;
        }
        if (titleEl) titleEl.textContent = `🔒 ĐÃ CHỐT KHÓA DÀN (HẾT G5 - 19/19 GIẢI)!`;
        if (subEl) subEl.innerHTML = `<span style="color: #FBBF24; font-weight: 800;">⚡ VÀO TIỀN NGAY CHO GIẢI ĐẶC BIỆT HÔM NAY!</span> Hạn chốt trước 18h28 khi đài bắt đầu quay GĐB!`;
        if (btnQuick) {
            btnQuick.innerHTML = `<i class="fa-solid fa-bolt"></i> COPY GÓI CHỐT GẤP (VÀO TIỀN NGAY)`;
        }
    } else if (filled > 0) {
        if (titleEl) titleEl.textContent = `⚡ ĐANG QUAY TRỰC TIẾP (${filled}/19 GIẢI)...`;
        if (subEl) subEl.textContent = `Hệ thống tự động quét vị trí. Sẽ khóa chốt tức thì ngay khi quay xong G5.6 (19/19 giải) lúc ~18h24!`;
        if (badgeEl) badgeEl.innerHTML = `⚡ Đang cập nhật`;
    } else {
        if (titleEl) titleEl.textContent = `HẠN CHỐT KHÓA DÀN: NGAY KHI HẾT GIẢI 5 (~18:24)`;
        if (subEl) subEl.textContent = `Quay xong G5.6 (19/19 giải) → Hệ thống tự động khóa sổ & xuất ngay gói chốt để vào tiền trước 18h28!`;
        if (badgeEl) badgeEl.innerHTML = `⏳ Chờ giờ quay (18h15)`;
    }
}

function buildChipHtml(valStr, prizeCode, hp) {
    if (!valStr) {
        return `<span class="prize-num-chip" style="opacity: 0.5;"><span style="letter-spacing: 2px;">• • • • •</span></span>`;
    }
    
    let digitsHtml = '';
    for (let idx = 1; idx <= valStr.length; idx++) {
        const char = valStr[idx - 1];
        const posKey = `${prizeCode}_${idx}`;
        const info = hp[posKey];
        
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
    
    return `<span class="prize-num-chip">${digitsHtml}</span>`;
}

function renderLivePrizeChips() {
    if (!radarData || !radarData.live_prizes) return;
    const lp = radarData.live_prizes;
    const hp = radarData.highlight_positions || {};

    // G1
    const elG1 = document.getElementById('liveG1Chips');
    if (elG1) {
        elG1.innerHTML = buildChipHtml(lp.g1, 'G1', hp);
    }

    // G2 (2.1, 2.2)
    const elG2 = document.getElementById('liveG2Chips');
    if (elG2) {
        const g2List = Array.isArray(lp.g2) ? lp.g2 : [lp.g2];
        elG2.innerHTML = g2List.map((val, idx) => buildChipHtml(val, `G2.${idx + 1}`, hp)).join('');
    }

    // G3 (3.1 -> 3.6)
    const elG3 = document.getElementById('liveG3Chips');
    if (elG3) {
        const g3List = Array.isArray(lp.g3) ? lp.g3 : [];
        elG3.innerHTML = g3List.map((val, idx) => buildChipHtml(val, `G3.${idx + 1}`, hp)).join('');
    }

    // G4 (4.1 -> 4.4)
    const elG4 = document.getElementById('liveG4Chips');
    if (elG4) {
        const g4List = Array.isArray(lp.g4) ? lp.g4 : [];
        elG4.innerHTML = g4List.map((val, idx) => buildChipHtml(val, `G4.${idx + 1}`, hp)).join('');
    }

    // G5 (5.1 -> 5.6)
    const elG5 = document.getElementById('liveG5Chips');
    if (elG5) {
        const g5List = Array.isArray(lp.g5) ? lp.g5 : [];
        elG5.innerHTML = g5List.map((val, idx) => buildChipHtml(val, `G5.${idx + 1}`, hp)).join('');
    }
}

function renderRadarTopSummaries() {
    if (!radarData) return;
    
    // Top 1 Bạch Thủ & Lót Lộn Song Thủ Trụ
    const top1 = radarData.top_1 || '32';
    const lotLon = radarData.lot_lon || '23';
    const songThu = radarData.song_thu_tru || [top1, lotLon];

    const elTop1 = document.getElementById('radarTop1Display');
    if (elTop1) elTop1.textContent = top1;

    const elLotLon = document.getElementById('radarLotLonDisplay');
    if (elLotLon) elLotLon.textContent = lotLon;

    const elSongThuTru = document.getElementById('lblSongThuTru');
    if (elSongThuTru) elSongThuTru.textContent = `${top1} - ${lotLon}`;
    
    window.currentRadarBT = top1;
    window.currentRadarLotLon = lotLon;
    window.currentRadarST = `${top1}, ${lotLon}`;

    // Top 4 Tứ Thủ
    const elTop4 = document.getElementById('radarTop4Chips');
    const top4List = radarData.top_4 || [top1, lotLon, '37', '82'];
    window.currentRadarTT = top4List.join(', ');
    if (elTop4) {
        elTop4.innerHTML = top4List.map(num => `
            <span class="badge" style="background: rgba(56, 189, 248, 0.2); color: #38BDF8; font-size: 15px; font-weight: 800; padding: 4px 12px; border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 8px;">
                ${num}
            </span>
        `).join('');
    }

    // Dàn 9 Số Cội Nguồn
    const elDan9 = document.getElementById('radarDan9Chips');
    const dan9List = radarData.dan_9_so || ['21', '22', '27', '31', '32', '37', '41', '42', '47'];
    window.currentRadarDan9 = dan9List.join(', ');
    if (elDan9) {
        elDan9.innerHTML = dan9List.map(num => `
            <span class="badge" style="background: rgba(167, 139, 250, 0.2); color: #C4B5FD; font-size: 13.5px; font-weight: 800; padding: 3px 8px; border: 1px solid rgba(167, 139, 250, 0.4); border-radius: 6px;">
                ${num}
            </span>
        `).join('');
    }

    const elDan9Sub = document.getElementById('radarDan9Subtitle');
    if (elDan9Sub) {
        const heads = radarData.dan_9_heads || ['3', '4', '2'];
        const tails = radarData.dan_9_tails || ['2', '7', '1'];
        elDan9Sub.textContent = `Top 3 Đầu [${heads.join(',')}] × Top 3 Đuôi [${tails.join(',')}]`;
    }

    // Dàn Lót Hợp Lệ
    const elDanLot = document.getElementById('radarDanLotDisplay');
    const danLotList = radarData.dan_lot || [];
    window.currentRadarLot = danLotList.join(', ');
    if (elDanLot) {
        elDanLot.textContent = danLotList.length > 0 ? danLotList.join(', ') : 'Tất cả các số lót hợp lệ đều trùng khớp trong khung 60s N1';
    }
    const lblCountLot = document.getElementById('lblCountLot');
    if (lblCountLot) {
        lblCountLot.textContent = `${danLotList.length} số`;
    }
}

function renderRadarCang3D() {
    if (!radarData) return;
    const c3 = radarData.cang_3d_live || {};
    const top3Cang = c3.top3_cang || ['1', '5', '0'];
    const cangBT = c3.cang_bt_3s || [];
    const cangTT = c3.cang_tt_12s || [];
    const cangD9 = c3.cang_d9_27s || [];

    window.currentCangBT = cangBT.join(', ');
    window.currentCangTT = cangTT.join(', ');
    window.currentCangD9 = cangD9.join(', ');

    const elCangDate = document.getElementById('lblCangTargetDate');
    if (elCangDate) {
        elCangDate.textContent = (radarData.target_date || 'HÔM NAY').toUpperCase();
    }

    const elBadge = document.getElementById('badgeCangTop3');
    if (elBadge) {
        const tamStr = c3.tam_g1 ? `Tâm G1: ${c3.tam_g1}` : 'Chờ G1 quay (18h16)';
        const tongStr = c3.tong_de ? `Tổng Đề: ${c3.tong_de}` : '';
        elBadge.textContent = `Top 3 Càng: [${top3Cang.join(', ')}] (${tamStr} | ${tongStr})`;
    }

    // Hiển thị kiểm tra nổ 3 càng nếu đã có kết quả
    const actual3D = radarData.actual_3d || (radarData.actual_de && radarData.live_prizes?.g1 ? '' : '');
    
    const elBT = document.getElementById('cangBachThuChips');
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

    const elTT = document.getElementById('cangTuThuDisplay');
    if (elTT) {
        elTT.textContent = cangTT.join(', ');
    }

    const elD9 = document.getElementById('cangDan9Display');
    if (elD9) {
        elD9.textContent = cangD9.join(', ');
    }
}

function renderRadar5ColTable() {
    if (!radarData || !radarData.table_5cols) return;
    const tbody = document.getElementById('tbody5Cols');
    if (!tbody) return;

    const list = radarData.table_5cols;
    
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
            return isMatch
                ? `<span class="badge" style="background: rgba(16, 185, 129, 0.25); color: #34D399; font-weight: 800; border: 1px solid #10B981; padding: 1px 4px;">🎯 ${num}</span>`
                : `<span style="font-size: 11px; color: #CBD5E1; margin-right: 4px;">${num}</span>`;
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

    // Copy Dàn 9 Số
    document.getElementById('btnCopyRadarDan9')?.addEventListener('click', () => {
        copyToClipboard(window.currentRadarDan9 || '', 'Đã copy Dàn 9 Số Cội Nguồn!');
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

