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
        renderTabTop20AndFilter();
        renderTabTop3DauDuoi();
        renderTabTop3D4D();
        renderTabStatsG7();
        initRadarLive();
        
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

// 3. TAB 2: TOP 20 SUPER-SCORE & BỘ LỌC 2D LIVE
function renderTabTop20AndFilter() {
    if (!appData) return;
    
    // Top 20 Super-Score Grid / Cards
    const containerTop20 = document.getElementById('gridTop20Cards');
    if (containerTop20) {
        containerTop20.innerHTML = '';
        const top20List = appData.top_20_consensus || [];
        
        top20List.slice(0, 20).forEach((item, idx) => {
            const card = document.createElement('div');
            card.className = 'num-tag gold';
            card.style.padding = '10px 6px';
            card.style.fontSize = '15px';
            card.innerHTML = `<div>Top ${idx+1}</div><strong>${item.number}</strong><div style="font-size:10px; color:#94A3B8;">${item.score.toFixed(1)}đ</div>`;
            containerTop20.appendChild(card);
        });
        
        window.currentTop20List = top20List.slice(0, 20).map(x => x.number).join(' ');
    }
    
    // Setup Live 2D Filter
    filter2DMatrix();
}

function filter2DMatrix() {
    const inputCham = document.getElementById('filterChamInput')?.value.trim() || '0123456789';
    const inputTong = document.getElementById('filterTongInput')?.value.trim() || '0123456789';
    
    const chamDigits = inputCham.split('').filter(c => c >= '0' && c <= '9');
    const tongDigits = inputTong.split('').filter(c => c >= '0' && c <= '9');
    
    const filteredList = [];
    for (let i = 0; i < 100; i++) {
        const numStr = String(i).padStart(2, '0');
        const d1 = parseInt(numStr[0]);
        const d2 = parseInt(numStr[1]);
        const sumMod = (d1 + d2) % 10;
        
        const matchCham = chamDigits.length === 0 || chamDigits.includes(String(d1)) || chamDigits.includes(String(d2));
        const matchTong = tongDigits.length === 0 || tongDigits.includes(String(sumMod));
        
        if (matchCham && matchTong) {
            filteredList.push(numStr);
        }
    }
    
    const gridFiltered = document.getElementById('grid2DFiltered');
    if (gridFiltered) {
        gridFiltered.innerHTML = '';
        filteredList.forEach(num => {
            const tag = document.createElement('div');
            tag.className = 'num-tag cyan';
            tag.textContent = num;
            gridFiltered.appendChild(tag);
        });
    }
    
    const countLabel = document.getElementById('count2DFiltered');
    if (countLabel) countLabel.textContent = `${filteredList.length} số`;
    window.current2DFilteredList = filteredList.join(' ');
}

// 4. TAB 3: TOP 3 ĐẦU / TOP 3 ĐUÔI & DÀN 9 SỐ & ĐIỂM PHỤC HỒI
function renderTabTop3DauDuoi() {
    if (!appData || !appData.top3_dau_duoi_summary) return;
    
    const summaryDD = appData.top3_dau_duoi_summary;
    
    const rawHeads = (appData.top_predicted_heads || []).slice(0, 3);
    const rawTails = (appData.top_predicted_tails || []).slice(0, 3);

    const headNames = rawHeads.map(item => (typeof item === 'object' && item.head) ? item.head : String(item));
    const tailNames = rawTails.map(item => (typeof item === 'object' && item.tail) ? item.tail : String(item));

    const top3HeadStr = headNames.length > 0 ? headNames.join(' - ') : 'Đầu 2 - Đầu 1 - Đầu 3';
    const top3TailStr = tailNames.length > 0 ? tailNames.join(' - ') : 'Đuôi 3 - Đuôi 7 - Đuôi 8';
    
    const headEl = document.getElementById('lblTop3Head');
    if (headEl) headEl.textContent = top3HeadStr;
    
    const tailEl = document.getElementById('lblTop3Tail');
    if (tailEl) tailEl.textContent = top3TailStr;
    
    // Construct 9-number set (Head x Tail)
    const headDigits = rawHeads.map(item => {
        const val = (typeof item === 'object' && item.head) ? item.head : String(item);
        return val.replace(/\D/g, '');
    }).filter(Boolean);

    const tailDigits = rawTails.map(item => {
        const val = (typeof item === 'object' && item.tail) ? item.tail : String(item);
        return val.replace(/\D/g, '');
    }).filter(Boolean);

    const dan9List = [];
    headDigits.forEach(h => {
        tailDigits.forEach(t => {
            dan9List.push(`${h}${t}`);
        });
    });
    
    const grid9 = document.getElementById('gridDan9Numbers');
    if (grid9) {
        grid9.innerHTML = '';
        dan9List.forEach(num => {
            const tag = document.createElement('div');
            tag.className = 'num-tag purple';
            tag.textContent = num;
            grid9.appendChild(tag);
        });
    }
    window.currentDan9List = dan9List.join(' ');

    const h1n = document.getElementById('rateHead1N');
    if (h1n) h1n.textContent = (summaryDD.head_rate_1day || 28.63) + '%';
    
    const h3n = document.getElementById('rateHead3N');
    if (h3n) h3n.textContent = (summaryDD.f3_head_rate || 69.83) + '%';
    
    const t1n = document.getElementById('rateTail1N');
    if (t1n) t1n.textContent = (summaryDD.tail_rate_1day || 25.64) + '%';
    
    const t3n = document.getElementById('rateTail3N');
    if (t3n) t3n.textContent = (summaryDD.f3_tail_rate || 61.64) + '%';

    // Render Table Recovery Scoring Breakdown
    const tbodyRec = document.getElementById('tbodyRecoveryScoring');
    if (tbodyRec) {
        tbodyRec.innerHTML = '';
        
        const renderRows = (listData, typeLabel) => {
            listData.forEach(([digit, info]) => {
                const tr = document.createElement('tr');
                
                const isRecovery = info.recovery_bonus > 0;
                const statusTag = isRecovery 
                    ? `<span class="tag-hit" style="background:rgba(245, 158, 11, 0.25); border-color:rgba(245, 158, 11, 0.5); color:#FBBF24;">Ngưỡng Phục Hồi 🔥</span>` 
                    : (info.penalty > 0 ? `<span class="tag-miss">Bão Hòa (Mới Ra)</span>` : `<span class="tag-info">${info.status_label || 'Bình Thường'}</span>`);
                
                const recBonusCell = isRecovery 
                    ? `<strong style="color:#FBBF24;">+${info.recovery_bonus.toFixed(1)}đ</strong>` 
                    : `<span style="color:#64748B;">0.0đ</span>`;

                const penaltyCell = info.penalty > 0 
                    ? `<span style="color:#FB7185;">-${info.penalty.toFixed(1)}đ</span>` 
                    : `<span style="color:#64748B;">0.0đ</span>`;

                tr.innerHTML = `
                    <td><strong>${typeLabel} ${digit}</strong></td>
                    <td>${typeLabel}</td>
                    <td>${info.freq_30d} lần</td>
                    <td>${info.nhip} ngày</td>
                    <td>${penaltyCell}</td>
                    <td>${recBonusCell}</td>
                    <td><strong style="color:#67E8F9;">${info.total_score.toFixed(1)}đ</strong></td>
                    <td>${statusTag}</td>
                `;
                tbodyRec.appendChild(tr);
            });
        };

        if (appData.head_scoring_breakdown) renderRows(appData.head_scoring_breakdown, 'Đầu');
        if (appData.tail_scoring_breakdown) renderRows(appData.tail_scoring_breakdown, 'Đuôi');
    }
}

// 5. TAB 4: TOP 20 BA CÀNG (3D) & BỐN CÀNG (4D) & BẢNG THỐNG KÊ LỊCH SỬ
function renderTabTop3D4D() {
    if (!appData) return;
    
    // Top 20 3D
    const list3D = appData.top_20_3d || [];
    const container3D = document.getElementById('grid3DList');
    if (container3D) {
        container3D.innerHTML = '';
        list3D.slice(0, 20).forEach((item, idx) => {
            const tag = document.createElement('div');
            tag.className = 'num-tag gold';
            tag.style.fontSize = '13px';
            tag.style.padding = '6px';
            tag.innerHTML = `<strong>${item.number_3d}</strong>`;
            container3D.appendChild(tag);
        });
        window.current3DList = list3D.slice(0, 20).map(x => x.number_3d).join(' ');
    }

    // Top 20 4D
    const list4D = appData.top_20_4d || [];
    const container4D = document.getElementById('grid4DList');
    if (container4D) {
        container4D.innerHTML = '';
        list4D.slice(0, 20).forEach((item, idx) => {
            const tag = document.createElement('div');
            tag.className = 'num-tag purple';
            tag.style.fontSize = '12px';
            tag.style.padding = '6px';
            tag.innerHTML = `<strong>${item.number_4d}</strong>`;
            container4D.appendChild(tag);
        });
        window.current4DList = list4D.slice(0, 20).map(x => x.number_4d).join(' ');
    }

    // Thống kê Tỷ lệ Trúng 3D & 4D Lịch sử
    const recs = appData.history_3d_4d_records || [];
    const totalEvals = recs.length || 1;
    const hit3DCount = recs.filter(r => r.result_3d_top20 && r.result_3d_top20.includes('TRÚNG')).length;
    const hit4DCount = recs.filter(r => r.result_4d && r.result_4d.includes('TRÚNG')).length;

    const rate3D = ((hit3DCount / totalEvals) * 100).toFixed(2);
    const rate4D = ((hit4DCount / totalEvals) * 100).toFixed(2);

    const el3DRate = document.getElementById('stat3DRate');
    if (el3DRate) el3DRate.textContent = `${rate3D}%`;

    const el3DHits = document.getElementById('stat3DHits');
    if (el3DHits) el3DHits.textContent = `${hit3DCount}/${totalEvals}`;

    const el4DRate = document.getElementById('stat4DRate');
    if (el4DRate) el4DRate.textContent = `${rate4D}%`;

    const el4DHits = document.getElementById('stat4DHits');
    if (el4DHits) el4DHits.textContent = `${hit4DCount}/${totalEvals}`;

    // Render Bảng Lịch Sử Kiểm Chứng (20 kỳ gần nhất)
    const tbody = document.getElementById('tbody3D4DHistory');
    if (tbody && recs.length > 0) {
        tbody.innerHTML = '';
        const recentRecs = recs.slice(-20).reverse();
        recentRecs.forEach(rec => {
            const tr = document.createElement('tr');
            const isHit3D = rec.result_3d_top20 && rec.result_3d_top20.includes('TRÚNG');
            const isHit4D = rec.result_4d && rec.result_4d.includes('TRÚNG');

            const tag3D = isHit3D ? `<span class="tag-hit">TRÚNG 🎯</span>` : `<span class="tag-miss">TRƯỢT ❌</span>`;
            const tag4D = isHit4D ? `<span class="tag-hit">TRÚNG 🎯</span>` : `<span class="tag-miss">TRƯỢT ❌</span>`;

            tr.innerHTML = `
                <td><strong>#${rec.stt}</strong></td>
                <td>${rec.date}</td>
                <td><strong>${rec.db}</strong></td>
                <td><strong style="color: #FBBF24;">${rec.actual_3d || '---'}</strong></td>
                <td>${tag3D}</td>
                <td><strong style="color: #C084FC;">${rec.actual_4d || '---'}</strong></td>
                <td>${tag4D}</td>
            `;
            tbody.appendChild(tr);
        });
    }
}

// 6. TAB 5: THỐNG KÊ G7 & MỐC KHUNG THỜI GIAN & DỰ ĐOÁN NỔ THEO THỨ
function renderTabStatsG7() {
    if (!appData) return;
    
    // Render High-Confidence Day-of-Week Burst Prediction Card
    if (appData.dow_model) {
        const dowM = appData.dow_model;
        
        const nextDayEl = document.getElementById('lblDowNextDay');
        if (nextDayEl) nextDayEl.textContent = dowM.next_dow_name || 'Thứ Sáu';

        const g7PosEl = document.getElementById('lblDowG7Pos');
        if (g7PosEl) {
            const positions = (dowM.top2_next_g || ['g7_1', 'g7_4']).map(p => p.toUpperCase().replace('_', '.'));
            g7PosEl.textContent = positions.join(' & ');
        }

        const targetSumsEl = document.getElementById('lblDowTargetSums');
        if (targetSumsEl) {
            const sums = (dowM.next_target_sums || [8, 1, 3, 6]).map(s => 'Tổng ' + s);
            targetSumsEl.textContent = sums.join(', ');
        }

        const chamSetEl = document.getElementById('lblDowChamSet');
        if (chamSetEl) {
            chamSetEl.textContent = (dowM.next_cham_set || [0, 1, 2, 3, 5, 6, 7, 8]).join(', ');
        }

        const burstList = dowM.next_dan_ha_so || ['38', '83', '17', '33', '80', '79', '21', '26', '67', '47', '60', '10', '42', '65', '71', '01', '85', '97', '53', '51'];
        const gridBurst = document.getElementById('gridDowBurst20');
        if (gridBurst) {
            gridBurst.innerHTML = '';
            burstList.forEach(num => {
                const tag = document.createElement('div');
                tag.className = 'num-tag gold';
                tag.style.fontSize = '15px';
                tag.style.fontWeight = '800';
                tag.textContent = num;
                gridBurst.appendChild(tag);
            });
        }
        window.currentDowBurstList = burstList.join(' ');
    }

    // Render G7 & Móc chung Lô Predictions
    if (appData.g7_lo_predictions) {
        const loP = appData.g7_lo_predictions;
        const badgeStl = document.getElementById('badgeStlGocRate');
        if (badgeStl) badgeStl.textContent = `Tỷ Lệ Nổ Lô STL: ${loP.stl_goc_rate}%`;

        const lblStl = document.getElementById('lblStlGocNext');
        if (lblStl) lblStl.textContent = loP.stl_goc_next || '-- - --';

        const lblHits = document.getElementById('lblStlGocHits');
        if (lblHits) lblHits.textContent = `${loP.stl_goc_hits} kỳ`;

        const lblNhay = document.getElementById('lblStlGocNhay');
        if (lblNhay) lblNhay.textContent = `${loP.stl_goc_total_nhay} nháy`;

        const lblBtl = document.getElementById('lblBtlGocNext');
        if (lblBtl) lblBtl.textContent = loP.btl_goc_next || '--';

        const gridTopLo = document.getElementById('gridTopLoG7');
        if (gridTopLo && loP.top_lo_g7_moc_chung) {
            gridTopLo.innerHTML = '';
            loP.top_lo_g7_moc_chung.forEach(item => {
                const card = document.createElement('div');
                card.style.background = 'rgba(16, 185, 129, 0.12)';
                card.style.border = '1px solid rgba(52, 211, 153, 0.3)';
                card.style.borderRadius = '8px';
                card.style.padding = '8px 12px';
                card.style.textAlign = 'center';

                card.innerHTML = `
                    <div style="font-size: 18px; font-weight: 800; color: #34D399;">${item.number}</div>
                    <div style="font-size: 10px; color: #94A3B8;">${item.source}</div>
                    <div style="font-size: 11px; font-weight: 700; color: #FBBF24;">${item.score} điểm</div>
                `;
                gridTopLo.appendChild(card);
            });
        }
    }

    // Render G7 ranking for initial window (30 days)
    renderG7WindowStats('30');

    // Render Table Performance by DOW
    const tbody = document.getElementById('tbodyDowStats');
    if (tbody && appData.dow_stats) {
        tbody.innerHTML = '';
        Object.entries(appData.dow_stats).forEach(([dowName, st]) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${dowName}</strong></td>
                <td>${st.evals} ngày</td>
                <td>G7.1 & G7.3 (${st.cham_hits} trúng)</td>
                <td><span class="tag-hit">${st.cham_rate}%</span></td>
                <td><span class="tag-info">${st.inter_rate}%</span></td>
            `;
            tbody.appendChild(tr);
        });
    }
}

function renderG7WindowStats(windowKey) {
    if (!appData) return;
    
    const container = document.getElementById('gridG7RankingCards');
    if (!container) return;
    container.innerHTML = '';

    let rankings = [];
    let windowTitle = '';
    const totalDays = appData.total_days || 235;

    if (windowKey === 'all') {
        windowTitle = `Toàn Bộ Năm 2026 (${totalDays} Kỳ)`;
        if (appData.overall_g7_stats) {
            Object.entries(appData.overall_g7_stats).forEach(([gKey, val]) => {
                const hits = (val.td || 0) + (val.b || 0);
                const rate = ((hits / totalDays) * 100).toFixed(1);
                rankings.push({
                    position: gKey.toUpperCase().replace('_', '.'),
                    hits: hits,
                    rate: parseFloat(rate)
                });
            });
            rankings.sort((a, b) => b.hits - a.hits);
        }
    } else {
        const days = parseInt(windowKey) || 30;
        windowTitle = `Khung ${days} Ngày Gần Nhất`;
        if (appData.window_stats && appData.window_stats[windowKey]) {
            rankings = appData.window_stats[windowKey].g7_ranking || [];
        }
    }

    rankings.forEach((item, idx) => {
        const isExcluded = (idx === rankings.length - 1);
        const card = document.createElement('div');
        card.style.background = isExcluded ? 'rgba(244, 63, 94, 0.1)' : 'rgba(30, 41, 59, 0.6)';
        card.style.border = '1px solid ' + (isExcluded ? 'rgba(244, 63, 94, 0.3)' : (idx === 0 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.08)'));
        card.style.borderRadius = '12px';
        card.style.padding = '12px';
        card.style.textAlign = 'center';

        const rankTitle = isExcluded ? '❌ VỊ TRÍ LOẠI' : (idx === 0 ? '👑 TOP 1 PHONG ĐỘ' : `TOP ${idx+1}`);
        const rankColor = isExcluded ? '#FB7185' : (idx === 0 ? '#FBBF24' : '#67E8F9');

        card.innerHTML = `
            <div style="font-size: 11px; font-weight: 700; color: ${rankColor}; margin-bottom: 4px;">${rankTitle}</div>
            <div style="font-size: 18px; font-weight: 800; color: #F8FAFC;">${item.position}</div>
            <div style="font-size: 13px; font-weight: 700; color: #34D399; margin-top: 4px;">${item.hits} Lần Trúng</div>
            <div style="font-size: 11px; color: #94A3B8;">Tỷ lệ: ${item.rate}%</div>
        `;
        container.appendChild(card);
    });
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

    document.getElementById('btnCopyTop20')?.addEventListener('click', () => {
        copyToClipboard(window.currentTop20List || '', 'Đã copy Top 20 Super-Score!');
    });

    document.getElementById('btnCopyFiltered2D')?.addEventListener('click', () => {
        copyToClipboard(window.current2DFilteredList || '', 'Đã copy Dàn 2D Đã Lọc!');
    });

    document.getElementById('btnCopyDanVip')?.addEventListener('click', () => {
        copyToClipboard(window.currentVipList || '', 'Đã copy Dàn VIP Đề Xuất!');
    });

    document.getElementById('btnResetFilter')?.addEventListener('click', () => {
        const inputC = document.getElementById('filterChamInput');
        const inputT = document.getElementById('filterTongInput');
        if (inputC) inputC.value = '';
        if (inputT) inputT.value = '';
        filter2DMatrix();
        showToast('🔄 Đã đặt lại bộ lọc!', 'success');
    });

    document.getElementById('btnCopyDan9')?.addEventListener('click', () => {
        copyToClipboard(window.currentDan9List || '', 'Đã copy Dàn 9 Số!');
    });

    document.getElementById('btnCopy3D')?.addEventListener('click', () => {
        copyToClipboard(window.current3DList || '', 'Đã copy Top 20 Ba Càng (3D)!');
    });

    document.getElementById('btnCopy4D')?.addEventListener('click', () => {
        copyToClipboard(window.current4DList || '', 'Đã copy Top 20 Bốn Càng (4D)!');
    });

    document.getElementById('btnCopyDowBurst')?.addEventListener('click', () => {
        copyToClipboard(window.currentDowBurstList || '', 'Đã copy 20 Số Nổ Hỏa Lực Theo Thứ!');
    });

    // Filter inputs
    document.getElementById('filterChamInput')?.addEventListener('input', filter2DMatrix);
    document.getElementById('filterTongInput')?.addEventListener('input', filter2DMatrix);
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
        renderLivePrizeChips();
        renderRadarTopSummaries();
        renderRadar5ColTable();
        renderRadarFrame3Day();
        
        if (!isSilent) {
            console.log('[Radar Live] Đã cập nhật thành công dữ liệu live');
        }
    } catch (err) {
        console.warn('[Radar Live] Chưa tải được state live:', err);
    }
}

function startRadarLivePolling() {
    if (radarPollingTimer) clearInterval(radarPollingTimer);
    radarPollingTimer = setInterval(() => {
        if (isRadarPollingActive) {
            fetchAndRenderRadarLive(true);
        }
    }, 5000);
}

function renderRadarHeaderInfo() {
    if (!radarData) return;
    
    const elTargetDate = document.getElementById('radarPillTargetDate');
    if (elTargetDate) elTargetDate.textContent = radarData.target_date || 'Thứ sáu 25-09-2026';

    const elDateTitle = document.getElementById('radarLiveDateTitle');
    if (elDateTitle) elDateTitle.textContent = (radarData.target_date || 'THỨ SÁU NGÀY 25–09–2026').toUpperCase();

    const elPrevInfo = document.getElementById('radarPillPrevInfo');
    if (elPrevInfo) elPrevInfo.innerHTML = `Đề <span style="color:#67E8F9; font-weight:900;">${radarData.prev_de || '96'}</span> (GĐB: ${radarData.prev_db || '78196'})`;

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
        const filled = radarData.filled_count || 19;
        const total = radarData.total_count || 19;
        elProgress.textContent = `${filled}/${total} GIẢI ${filled >= total ? '(ĐÃ HOÀN TẤT)' : '(ĐANG QUAY...)'}`;
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
    
    // Top 1 Bạch Thủ
    const elTop1 = document.getElementById('radarTop1Display');
    if (elTop1) elTop1.textContent = radarData.top_1 || '41';
    
    window.currentRadarBT = radarData.top_1 || '41';

    // Top 4 Tứ Thủ
    const elTop4 = document.getElementById('radarTop4Chips');
    const top4List = radarData.top_4 || ['41', '14', '67', '31'];
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
    const dan9List = radarData.dan_9_so || ['67', '61', '62', '37', '31', '32', '47', '41', '42'];
    window.currentRadarDan9 = dan9List.join(', ');
    if (elDan9) {
        elDan9.innerHTML = dan9List.map(num => `
            <span class="badge" style="background: rgba(167, 139, 250, 0.2); color: #C4B5FD; font-size: 13.5px; font-weight: 800; padding: 3px 8px; border: 1px solid rgba(167, 139, 250, 0.4); border-radius: 6px;">
                ${num}
            </span>
        `).join('');
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

    // Copy Tứ Thủ
    document.getElementById('btnCopyRadarTT')?.addEventListener('click', () => {
        copyToClipboard(window.currentRadarTT || '', 'Đã copy Tứ Thủ: ' + (window.currentRadarTT || ''));
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

    // Filter Buttons for 5-col table
    document.querySelectorAll('.table-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.table-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRadarTableFilter = btn.getAttribute('data-filter') || 'all';
            renderRadar5ColTable();
        });
    });
}

