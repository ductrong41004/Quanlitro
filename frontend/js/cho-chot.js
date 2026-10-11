let allContracts = [];
let allInvoices  = [];

// ===== Khởi tạo bộ lọc Tháng / Năm =====
function initFilterCC() {
    const d        = new Date();
    const curMonth = d.getMonth() + 1;
    const curYear  = d.getFullYear();

    const mSelect = document.getElementById('filter-thang-cc');
    let mHtml = '';
    for (let i = 1; i <= 12; i++) {
        mHtml += `<option value="${i}" ${i === curMonth ? 'selected' : ''}>Tháng ${i}</option>`;
    }
    mSelect.innerHTML = mHtml;

    const ySelect = document.getElementById('filter-nam-cc');
    let yHtml = '';
    for (let i = curYear - 1; i <= curYear + 1; i++) {
        yHtml += `<option value="${i}" ${i === curYear ? 'selected' : ''}>${i}</option>`;
    }
    ySelect.innerHTML = yHtml;
}

// ===== Load hoá đơn theo tháng/năm đang chọn =====
async function loadInvoicesForMonth() {
    const month = parseInt(document.getElementById('filter-thang-cc').value);
    const year  = parseInt(document.getElementById('filter-nam-cc').value);
    const res   = await api.get(`/hoa-don?thang=${month}&nam=${year}`);
    allInvoices = res.success ? res.data : [];
}

// ===== Khi đổi tháng/năm: reload hoá đơn rồi render lại =====
async function onThangNamChange() {
    await loadInvoicesForMonth();
    renderChoChotByMonth();
}

// ===== Tải toàn bộ hợp đồng từ server =====
async function loadChoChotHoaDon() {
    const container = document.getElementById('main-content-wrap');
    container.innerHTML = `<div class="loading-overlay" style="display:flex;height:300px;padding-top:50px;"><div class="loading-spinner"></div></div>`;

    const res = await api.get('/hop-dong?trangThai=DANG_HIEU_LUC');

    if (!res.success) {
        showToast('Lỗi tải dữ liệu', 'error');
        container.innerHTML = `<div class="empty-state">Lỗi kết nối máy chủ</div>`;
        return;
    }

    // Badge hoá đơn chưa thanh toán trên menu
    try {
        const resDashboard = await api.get('/dashboard');
        if (resDashboard.success && resDashboard.data.soHoaDonChuaThanhToan > 0) {
            document.getElementById('badge-chua-tt').textContent = resDashboard.data.soHoaDonChuaThanhToan;
            document.getElementById('badge-chua-tt').style.display = 'inline-block';
        }
    } catch(e) {}

    allContracts = res.data;
    await loadInvoicesForMonth();
    renderChoChotByMonth();
}

// ===== Render bảng theo tháng/năm + tìm kiếm =====
function renderChoChotByMonth() {
    const month = parseInt(document.getElementById('filter-thang-cc').value);
    const year  = parseInt(document.getElementById('filter-nam-cc').value);
    const kw    = (document.getElementById('search-cc').value || '').toLowerCase().trim();
    const container = document.getElementById('main-content-wrap');

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let upcoming = [];

    allContracts.forEach(hd => {
        const paymentDay = hd.ngayTraTien;
        if (!paymentDay) return;

        const targetDate = new Date(year, month - 1, paymentDay, 0, 0, 0);
        const diffDays   = Math.ceil((targetDate - todayStart) / (1000 * 60 * 60 * 24));

        // Kiểm tra đã có hoá đơn kỳ này chưa
        const existingInv = allInvoices.find(inv => inv.phong.id === hd.phong.id);

        upcoming.push({
            hopDongId       : hd.id,
            phongId         : hd.phong.id,
            soPhong         : hd.phong.soPhong,
            khuVuc          : hd.phong.khuVuc || '',
            tenKhach        : hd.khachThues && hd.khachThues.length
                ? hd.khachThues.map(k => k.hoTen).join('<br>')
                : '<span style="color:var(--text-muted)">Chưa có</span>',
            ngayGhi         : targetDate,
            conLai          : diffDays,
            daLapHoaDon     : !!existingInv,
            hoaDonId        : existingInv ? existingInv.id : null,
            hoaDonTrangThai : existingInv ? existingInv.trangThai : null,
        });
    });

    // ── Tìm kiếm theo số phòng hoặc khu vực ──
    if (kw) {
        upcoming = upcoming.filter(item => {
            const sp = item.soPhong.toLowerCase();
            const kv = item.khuVuc.toLowerCase();
            // Khớp khu vực (ví dụ: "B") hoặc tên phòng (ví dụ: "A1", "101")
            return sp.includes(kw) || kv === kw || kv.includes(kw);
        });
    }

    // ── Sắp xếp: chưa lập lên trước → gần hạn lên đầu ──
    upcoming.sort((a, b) => {
        if (a.daLapHoaDon !== b.daLapHoaDon) return a.daLapHoaDon ? 1 : -1;
        return a.conLai - b.conLai;
    });

    if (upcoming.length === 0) {
        const msg = kw
            ? `Không tìm thấy phòng "<strong>${kw.toUpperCase()}</strong>" trong tháng ${month}/${year}`
            : 'Hiện không có phòng nào đang hiệu lực!';
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">${kw ? '🔍' : '🎉'}</div><h3>${msg}</h3></div>`;
        return;
    }

    container.innerHTML = `
        <div class="table-wrap">
            <table class="card-table-mobile">
                <thead><tr>
                    <th>Khu / Phòng</th>
                    <th>Người đại diện HĐ</th>
                    <th>Ngày thu tiền (Tháng ${month}/${year})</th>
                    <th>Trạng thái</th>
                    <th style="text-align:right">Thao tác</th>
                </tr></thead>
                <tbody>
                    ${upcoming.map(item => {
                        const day = item.ngayGhi.getDate().toString().padStart(2, '0');
                        const mon = (item.ngayGhi.getMonth() + 1).toString().padStart(2, '0');

                        // ── Badge trạng thái ──
                        let timeBadge;
                        if (item.daLapHoaDon) {
                            timeBadge = item.hoaDonTrangThai === 'DA_THANH_TOAN'
                                ? '<span class="badge badge-success">✅ Đã thanh toán</span>'
                                : '<span class="badge badge-warning">🧾 Đã lập – Chưa TT</span>';
                        } else if (item.conLai === 0) {
                            timeBadge = '<span class="badge badge-danger">❗️ Ghi bảng hôm nay</span>';
                        } else if (item.conLai < 0) {
                            timeBadge = `<span class="badge" style="background:var(--danger);color:white;">Trễ/Nợ ${-item.conLai} ngày</span>`;
                        } else if (item.conLai <= 5) {
                            timeBadge = `<span class="badge badge-warning">Sắp tới (Còn ${item.conLai} ngày)</span>`;
                        } else {
                            timeBadge = `<span class="badge" style="background:rgba(255,255,255,0.1);color:var(--text-muted)">Còn ${item.conLai} ngày</span>`;
                        }

                        // ── Nút thao tác ──
                        let actionBtn;
                        if (item.daLapHoaDon) {
                            actionBtn = `<a href="hoa-don.html?viewHoaDon=${item.hoaDonId}" class="action-link" style="background:rgba(16,185,129,0.12);color:var(--success)">📄 Xem chi tiết HĐ</a>`;
                        } else {
                            const urlLHD = `hoa-don.html?action=new&phongId=${item.phongId}&thang=${month}&nam=${year}`;
                            actionBtn = `<a href="${urlLHD}" class="action-link">✍️ Lập hóa đơn ngay</a>`;
                        }

                        const dimStyle = item.daLapHoaDon ? 'opacity:0.6;' : '';

                        return `
                        <tr style="transition:background 0.2s;cursor:default;${dimStyle}"
                            onmouseover="this.style.background='rgba(255,255,255,0.02)'"
                            onmouseout="this.style.background=''">
                            <td data-label="Phòng" style="white-space: nowrap;">
                                <strong>Phòng ${item.soPhong}</strong>
                                ${item.khuVuc ? `<div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Khu ${item.khuVuc}</div>` : ''}
                            </td>
                            <td data-label="Đại diện"><div style="line-height:1.4">${item.tenKhach}</div></td>
                            <td data-label="Ngày thu tiền"><div style="font-weight:600;color:var(--text); white-space: nowrap;">${day}/${mon}/${item.ngayGhi.getFullYear()}</div></td>
                            <td data-label="Trạng thái">${timeBadge}</td>
                            <td class="td-actions" style="text-align:right">${actionBtn}</td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// ===== Init =====
(async function () {
    initFilterCC();
    await loadChoChotHoaDon();
})();
