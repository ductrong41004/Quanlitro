let chartDoanhThu = null;
let chartPhong = null;

async function loadDashboard() {
    const now = new Date();
    document.getElementById('current-date').textContent =
        now.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('year-label').textContent = `Năm ${now.getFullYear()}`;

    const res = await api.get('/dashboard');
    if (!res.success) {
        showToast(res.message || 'Lỗi tải dashboard', 'error');
        return;
    }

    const d = res.data;

    // Stats
    document.getElementById('tong-phong').textContent = d.tongSoPhong;
    document.getElementById('phong-trong').textContent = d.soPhongTrong;
    document.getElementById('phong-da-thue').textContent = d.soPhongDaThue;
    document.getElementById('hd-chua-tt').textContent = d.soHoaDonChuaThanhToan;
    document.getElementById('doanh-thu-thang').textContent = formatCurrency(d.doanhThuThang);
    document.getElementById('doanh-thu-nam').textContent = formatCurrency(d.doanhThuNam);

    // Badge sidebar
    const badge = document.getElementById('badge-chua-tt');
    if (d.soHoaDonChuaThanhToan > 0) {
        badge.textContent = d.soHoaDonChuaThanhToan;
        badge.style.display = 'inline-block';
    }

    // Chart doanh thu
    renderChartDoanhThu(d.bieuDoDoanhThu || []);

    // Chart phong
    renderChartPhong(d.soPhongTrong, d.soPhongDaThue, d.soPhongDangSua);

    // Sắp hết hạn
    renderSapHetHan(d.hopDongSapHetHan || []);

    // Phòng chờ chốt hóa đơn (Tính toán nội bộ)
    await loadChoChotHoaDon();
}

function renderChartDoanhThu(data) {
    const ctx = document.getElementById('chart-doanh-thu').getContext('2d');
    const labels = Array.from({length: 12}, (_, i) => `T${i+1}`);
    const values = Array(12).fill(0);
    data.forEach(item => { values[item.thang - 1] = parseFloat(item.doanhThu) || 0; });

    if (chartDoanhThu) chartDoanhThu.destroy();
    chartDoanhThu = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Doanh thu (VNĐ)',
                data: values,
                backgroundColor: 'rgba(99,102,241,0.6)',
                borderColor: '#6366f1',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => formatCurrency(ctx.parsed.y)
                    }
                }
            },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9191a8' } },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#9191a8', callback: v => (v >= 1000000 ? (v/1000000).toFixed(1)+'M' : v) }
                }
            }
        }
    });
}

function renderChartPhong(trong, daThue, dangSua) {
    const ctx = document.getElementById('chart-phong').getContext('2d');
    if (chartPhong) chartPhong.destroy();
    chartPhong = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Trống', 'Đã thuê', 'Đang sửa'],
            datasets: [{
                data: [trong, daThue, dangSua],
                backgroundColor: ['rgba(16,185,129,0.8)', 'rgba(99,102,241,0.8)', 'rgba(245,158,11,0.8)'],
                borderColor: ['#10b981', '#6366f1', '#f59e0b'],
                borderWidth: 2,
                hoverOffset: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.raw} phòng` } }
            }
        }
    });

    // Custom legend
    const legend = document.getElementById('phong-legend');
    const colors = ['#10b981', '#6366f1', '#f59e0b'];
    const labels = ['Trống', 'Đã thuê', 'Đang sửa'];
    const vals = [trong, daThue, dangSua];
    legend.innerHTML = labels.map((l, i) => `
        <div style="display:flex;align-items:center;gap:6px;font-size:13px;">
            <span style="width:12px;height:12px;border-radius:3px;background:${colors[i]};display:inline-block;"></span>
            <span style="color:var(--text-muted)">${l}</span>
            <strong style="color:var(--text-primary)">${vals[i]}</strong>
        </div>
    `).join('');
}

function renderSapHetHan(list) {
    const container = document.getElementById('sap-het-han-content');
    if (!list.length) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">✅</div><h3>Không có hợp đồng sắp hết hạn</h3></div>`;
        return;
    }
    container.innerHTML = `
        <div class="table-wrap">
            <table>
                <thead><tr>
                    <th>Phòng</th>
                    <th>Khách thuê</th>
                    <th>Số điện thoại</th>
                    <th>Ngày kết thúc</th>
                    <th>Còn lại</th>
                </tr></thead>
                <tbody>
                    ${list.map(hd => `
                        <tr>
                            <td><strong>Phòng ${hd.soPhong}</strong></td>
                            <td>${hd.tenKhach}</td>
                            <td>${hd.soDienThoai || '—'}</td>
                            <td>${formatDate(hd.ngayKetThuc)}</td>
                            <td>
                                <span class="badge ${hd.soNgayConLai <= 7 ? 'badge-danger' : hd.soNgayConLai <= 15 ? 'badge-warning' : 'badge-info'}">
                                    ${hd.soNgayConLai} ngày
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function loadChoChotHoaDon() {
    const res = await api.get('/hop-dong?trangThai=DANG_HIEU_LUC');
    const container = document.getElementById('cho-chot-hoa-don-content');
    
    if (!res.success) {
        container.innerHTML = `<div class="empty-state">Lỗi tải dữ liệu</div>`;
        return;
    }
    
    const currentDate = new Date();
    const todayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    
    const upcoming = [];
    
    res.data.forEach(hd => {
        const paymentDay = hd.ngayTraTien;
        if (!paymentDay) return;
        
        let targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), paymentDay, 0, 0, 0);
        
        // Nếu ngày của tháng này đã qua đi rồi, thì xét tháng kế tiếp
        if (targetDate < todayStart) {
            targetDate.setMonth(targetDate.getMonth() + 1);
        }
        
        const diffTime = targetDate - todayStart;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Cảnh báo trước 5 ngày và kể cả những ngày đang mòn mỏi tới hạn (diffDays=0 là đúng hôm nay)
        if (diffDays >= 0 && diffDays <= 5) {
            upcoming.push({
                phong: hd.phong.soPhong,
                khuVuc: hd.phong.khuVuc,
                ngayGhi: targetDate,
                conLai: diffDays,
                gia: hd.giaThueHopDong
            });
        }
    });

    upcoming.sort((a, b) => a.conLai - b.conLai);

    if (upcoming.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon" style="opacity:0.6; font-size:40px;">⏳</div><h3 style="font-size:14px; font-weight:500;">Chưa có phòng nào sát ngày lấy tiền!</h3></div>`;
        return;
    }

    container.innerHTML = `
        <div class="table-wrap">
            <table>
                <thead><tr>
                    <th>Phòng / Khu</th>
                    <th>Ngày chốt</th>
                    <th>Thời gian</th>
                </tr></thead>
                <tbody>
                    ${upcoming.map(item => {
                        const day = item.ngayGhi.getDate().toString().padStart(2, '0');
                        const mon = (item.ngayGhi.getMonth() + 1).toString().padStart(2, '0');
                        return `
                        <tr>
                            <td>
                                <strong>Phòng ${item.phong}</strong>
                                ${item.khuVuc ? `<div style="font-size:12px;color:var(--text-muted)">Khu ${item.khuVuc}</div>` : ''}
                            </td>
                            <td><div style="font-weight:600">${day}/${mon}/${item.ngayGhi.getFullYear()}</div></td>
                            <td>
                                <span class="badge ${item.conLai === 0 ? 'badge-danger' : 'badge-warning'}">
                                    ${item.conLai === 0 ? '❗️ Hôm nay' : `Còn ${item.conLai} ngày`}
                                </span>
                            </td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Init
loadDashboard();
