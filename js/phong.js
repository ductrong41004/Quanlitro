let phongList = [];
let currentContract = null;
let allKhachBoSungList = [];
let selectedKhachIds = new Set();

async function loadDanhSachPhong() {
    const trangThai = document.getElementById('filter-trang-thai').value;
    let url = '/phong';
    if (trangThai) url += `?trangThai=${trangThai}`;

    const res = await api.get(url);
    if (!res.success) {
        showToast(res.message, 'error');
        return;
    }
    phongList = res.data;
    renderPhongList(phongList);

    // Tự động lấy danh sách khu vực đã có để đưa vào datalist và bộ lọc HTML
    const areas = [...new Set(phongList.map(p => p.khuVuc).filter(Boolean))].sort();
    document.getElementById('khuvuc-list').innerHTML = areas.map(a => `<option value="${a}">Khu ${a}</option>`).join('');
    
    const filterSelect = document.getElementById('filter-khu-vuc');
    if (filterSelect) {
        const currentVal = filterSelect.value;
        filterSelect.innerHTML = `<option value="">Tất cả khu vực</option>` + 
            areas.map(a => `<option value="${a}" ${currentVal === a ? 'selected' : ''}>Khu ${a}</option>`).join('');
    }
}

function filterPhongLocally() {
    const kw = document.getElementById('search-phong').value.toLowerCase();
    const kv = document.getElementById('filter-khu-vuc') ? document.getElementById('filter-khu-vuc').value : '';
    
    const filtered = phongList.filter(p => {
        const matchKhuVuc = !kv || p.khuVuc === kv;
        const matchSearch = p.soPhong.toLowerCase().includes(kw);
        return matchKhuVuc && matchSearch;
    });
    renderPhongList(filtered);
}

function renderPhongList(list) {
    const container = document.getElementById('phong-container');
    if (!list.length) {
        container.innerHTML = `<div class="empty-state" style="grid-column: 1/-1"><div class="empty-icon">🏠</div><h3>Không tìm thấy phòng nào</h3></div>`;
        return;
    }

    container.innerHTML = list.map(p => {
        const clsMap = { 'TRONG': 'trong', 'DA_THUE': 'da-thue', 'DANG_SUA': 'dang-sua' };
        return `
            <div class="phong-card ${clsMap[p.trangThai]}" style="display:flex; flex-direction:column;">
                <div onclick="xemChiTietPhong(${p.id})" style="cursor:pointer; flex:1; padding-bottom:12px;" title="Nhấn để xem chi tiết phòng">
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <h3 style="color:var(--primary-light); font-size:22px; margin:0">${p.soPhong}</h3>
                        ${trangThaiPhongBadge(p.trangThai)}
                    </div>
                    <div style="color:var(--text-muted); font-size:12px; margin-top:4px;">
                        ${p.khuVuc ? 'Khu ' + p.khuVuc : 'Chưa xếp khu'} • ${p.dienTich ? p.dienTich + ' m²' : '-- m²'}
                    </div>
                    <div class="room-price" style="margin: 12px 0;">${formatCurrency(p.giaThue)} / tháng</div>
                    <div style="font-size:12px; color:var(--text-muted); height: 36px; overflow: hidden; text-overflow: ellipsis;">
                        ${p.moTa || 'Chưa có mô tả'}
                    </div>
                </div>
                <div class="room-actions" style="margin-top:auto;">
                    <button class="btn btn-ghost btn-sm" style="flex:1" onclick="openModalPhong(${p.id})">Sửa</button>
                    ${p.trangThai !== 'DA_THUE' ? `<button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="deletePhong(${p.id})">Xóa</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

async function openModalPhong(id = null) {
    const title = document.getElementById('modal-phong-title');
    const form = document.getElementById('form-phong');
    document.getElementById('p-trang-thai').options[1].disabled = true;

    if (id) {
        title.textContent = 'Sửa thông tin phòng';
        const p = phongList.find(x => x.id === id);
        if(!p) return;
        document.getElementById('p-id').value = p.id;
        document.getElementById('p-so-phong').value = p.soPhong;
        document.getElementById('p-khuvuc').value = p.khuVuc || '';
        document.getElementById('p-dien-tich').value = p.dienTich || '';
        document.getElementById('p-gia-thue').value = formatMoney(p.giaThue);
        document.getElementById('p-trang-thai').value = p.trangThai;
        document.getElementById('p-mo-ta').value = p.moTa || '';
        
        // Load số dư đầu kỳ của phòng
        document.getElementById('p-chi-so-dien').value = p.chiSoDien !== null && p.chiSoDien !== undefined ? p.chiSoDien : '';
        document.getElementById('p-chi-so-nuoc').value = p.chiSoNuoc !== null && p.chiSoNuoc !== undefined ? p.chiSoNuoc : '';

        if (p.trangThai === 'DA_THUE') {
           document.getElementById('p-trang-thai').options[1].disabled = false;
        }

    } else {
        title.textContent = 'Thêm phòng mới';
        form.reset();
        document.getElementById('p-khuvuc').value = '';
        document.getElementById('p-trang-thai').value = 'TRONG';
        document.getElementById('p-chi-so-dien').value = '';
        document.getElementById('p-chi-so-nuoc').value = '';
    }
    openModal('modal-phong');
}

async function savePhong() {
    const id = document.getElementById('p-id').value;
    const body = {
        soPhong: document.getElementById('p-so-phong').value.trim(),
        khuVuc: document.getElementById('p-khuvuc').value.trim() || null,
        dienTich: document.getElementById('p-dien-tich').value ? parseFloat(document.getElementById('p-dien-tich').value) : null,
        giaThue: parseNum(document.getElementById('p-gia-thue').value) || 0,  // FIX: parseNum xử lý dấu phẩy, không dùng parseFloat
        trangThai: document.getElementById('p-trang-thai').value,
        moTa: document.getElementById('p-mo-ta').value.trim()
    };

    if (!body.soPhong || !body.giaThue) {
        showToast('Vui lòng nhập số phòng và giá thuê', 'warning');
        return;
    }

    let res;
    if (id) {
        res = await api.put(`/phong/${id}`, body);
    } else {
        res = await api.post('/phong', body);
    }

    if (res.success) {
        // Cập nhật chỉ số điện/nước nếu có nhập và đang sửa phòng có khách
        const chiSoDien = document.getElementById('p-chi-so-dien')?.value;
        const chiSoNuoc = document.getElementById('p-chi-so-nuoc')?.value;
        const savedId = id || res.data?.id;
        if (savedId && (chiSoDien || chiSoNuoc)) {
            const chiSoBody = {};
            if (chiSoDien) chiSoBody.chiSoDien = parseFloat(chiSoDien);
            if (chiSoNuoc) chiSoBody.chiSoNuoc = parseFloat(chiSoNuoc);
            const resChiSo = await api.put(`/phong/${savedId}/chi-so`, chiSoBody);
            if (resChiSo.success) {
                showToast(res.message + ' + Cập nhật chỉ số điện/nước thành công!', 'success');
            } else {
                showToast(res.message + ' | Chỉ số: ' + resChiSo.message, 'warning');
            }
        } else {
            showToast(res.message, 'success');
        }
        closeModal('modal-phong');
        loadDanhSachPhong();
    } else {
        showToast(res.message, 'error');
    }
}

function deletePhong(id) {
    confirmAction('Bạn có chắc muốn xóa phòng này không?', async () => {
        const res = await api.delete(`/phong/${id}`);
        if (res.success) {
            showToast(res.message, 'success');
            loadDanhSachPhong();
        } else {
            showToast(res.message, 'error');
        }
    });
}

// Init
loadDanhSachPhong();

// Tự reload danh sách phòng khi user quay lại tab này
// (đảm bảo giá phòng luôn cập nhật theo hoá đơn mới nhất)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        loadDanhSachPhong();
    }
});

// ===== Sync giá phòng từ toàn bộ Hoá Đơn trong DB =====
async function syncGiaTuHoaDon() {
    const btn = document.getElementById('btn-sync-gia');
    const origText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '⏳ Đang sync...';

    try {
        // 1. Lấy toàn bộ hoá đơn (không lọc tháng/năm)
        const resHD = await api.get('/hoa-don');
        if (!resHD.success) {
            showToast('Không tải được dữ liệu hoá đơn!', 'error');
            return;
        }

        // 2. Nhóm theo phongId, giữ hoá đơn mới nhất (nam giảm, thang giảm)
        const latestByPhong = {};
        resHD.data.forEach(hd => {
            const pid = hd.phong.id;
            if (!latestByPhong[pid]) {
                latestByPhong[pid] = hd;
            } else {
                const cur = latestByPhong[pid];
                if (hd.nam > cur.nam || (hd.nam === cur.nam && hd.thang > cur.thang)) {
                    latestByPhong[pid] = hd;
                }
            }
        });

        // 3. Cập nhật giá từng phòng (nếu giá HĐ hợp lệ)
        const entries = Object.entries(latestByPhong);
        let updated = 0;
        let errors = [];

        for (const [phongId, hd] of entries) {
            const giaThue = parseFloat(hd.tienPhong);
            if (!giaThue || giaThue <= 0) continue;

            // Tìm phòng hiện tại trong phongList để giữ các field khác
            const phong = phongList.find(p => p.id === parseInt(phongId));
            if (!phong) continue;

            // Chỉ gọi API nếu giá thực sự khác
            if (Math.abs(parseFloat(phong.giaThue) - giaThue) < 1) continue;

            const body = {
                soPhong: phong.soPhong,
                khuVuc: phong.khuVuc || null,
                dienTich: phong.dienTich || null,
                giaThue: giaThue,
                trangThai: phong.trangThai,
                moTa: phong.moTa || ''
            };
            const res = await api.put(`/phong/${phongId}`, body);
            if (res.success) {
                updated++;
            } else {
                errors.push(`Phòng ${phong.soPhong}: ${res.message}`);
            }
        }

        // 4. Reload lại danh sách phòng
        await loadDanhSachPhong();

        if (errors.length > 0) {
            showToast(`Sync xong! Cập nhật ${updated} phòng. Lỗi: ${errors.join(', ')}`, 'warning');
        } else if (updated === 0) {
            showToast('✅ Tất cả phòng đều đang đúng giá! Không cần cập nhật.', 'info');
        } else {
            showToast(`✅ Đã cập nhật giá cho ${updated} phòng từ hoá đơn!`, 'success');
        }
    } catch (e) {
        console.error(e);
        showToast('Lỗi không xác định: ' + e.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = origText;
    }
}

// Khởi tạo format tiền cho ô giá thuê
applyMoneyInput(document.getElementById('p-gia-thue'), { autoScale: true });


async function xemChiTietPhong(id) {
    const p = phongList.find(x => x.id === id);
    if (!p) return;
    
    document.getElementById('chitiet-phong-title').textContent = `Chi tiết Phòng: ${p.soPhong}`;

    // Fetch latest meter readings (source of truth)
    const resChiSo = await api.get('/hoa-don/chi-so-cu?phongId=' + id);
    let dienHienTai = p.chiSoDien || 0;
    let nuocHienTai = p.chiSoNuoc || 0;
    if (resChiSo.success) {
        dienHienTai = resChiSo.data.dien;
        nuocHienTai = resChiSo.data.nuoc;
    }

    // Render Room Info
    document.getElementById('ct-phong-body').innerHTML = `
        <tr><td style="width:120px; color:var(--text-muted); padding:6px 0;">🔴 Khu vực:</td><td><strong>${p.khuVuc ? 'Khu '+p.khuVuc : '—'}</strong></td></tr>
        <tr><td style="color:var(--text-muted); padding:6px 0;">🔴 Diện tích:</td><td><strong>${p.dienTich ? p.dienTich + ' m²' : '—'}</strong></td></tr>
        <tr><td style="color:var(--text-muted); padding:6px 0;">🔴 Giá định mức:</td><td><strong>${formatCurrency(p.giaThue)} / tháng</strong></td></tr>
        <tr><td style="color:var(--text-muted); padding:6px 0;">🔴 Trạng thái:</td><td>${trangThaiPhongBadge(p.trangThai)}</td></tr>
        <tr><td style="color:var(--text-muted); padding:6px 0;">⚡ Chỉ số điện:</td><td><strong style="color:var(--primary-light);">${dienHienTai}</strong></td></tr>
        <tr><td style="color:var(--text-muted); padding:6px 0;">💧 Chỉ số nước:</td><td><strong style="color:var(--info);">${nuocHienTai}</strong></td></tr>
        <tr><td style="color:var(--text-muted); padding:6px 0;">🔴 Mô tả thêm:</td><td>${p.moTa || '—'}</td></tr>
    `;

    // Reset others with loading
    document.getElementById('ct-khach-body').innerHTML = `<tr><td colspan="2"><div class="loading-spinner" style="margin:10px auto"></div></td></tr>`;
    document.getElementById('ct-hopdong-body').innerHTML = `<tr><td colspan="2"><div class="loading-spinner" style="margin:10px auto"></div></td></tr>`;

    openModal('modal-chitiet-phong');

    const btnBoSung = document.getElementById('btn-bo-sung-khach');

    if (p.trangThai === 'DA_THUE') {
        const resHD = await api.get('/hop-dong?trangThai=DANG_HIEU_LUC');
        if (resHD.success) {
            const contract = resHD.data.find(hd => hd.phong.id === id);
            if (contract) {
                currentContract = contract;
                if (btnBoSung) btnBoSung.style.display = '';

                const khachThues = contract.khachThues || [];
                let khachHTML = khachThues.map((k, index) => `
                    <tr><td colspan="2" style="background:rgba(255,255,255,0.05); padding:8px; border-radius:4px; margin-top:10px; display:block">
                        <strong style="color:var(--success)">👤 ${index + 1}. ${k.hoTen}</strong>
                    </td></tr>
                    <tr><td style="width:120px; color:var(--text-muted); padding:6px 0;">📞 SĐT:</td><td><strong>${k.soDienThoai || '—'}</strong></td></tr>
                    <tr><td style="color:var(--text-muted); padding:6px 0;">🪪 CCCD:</td><td><strong>${k.cccd || '—'}</strong></td></tr>
                    <tr><td style="color:var(--text-muted); padding:6px 0;">🏠 Quê quán:</td><td><strong>${k.diaChi || '—'}</strong></td></tr>
                `).join('');

                if (!khachHTML) {
                    khachHTML = `<tr><td colspan="2" style="text-align:center; padding:12px; color:var(--warning);">⚠️ Chưa có khách — Nhấn <strong>Bổ sung khách</strong> để thêm vào!</td></tr>`;
                }
                document.getElementById('ct-khach-body').innerHTML = khachHTML;

                document.getElementById('ct-hopdong-body').innerHTML = `
                    <tr><td style="width:120px; color:var(--text-muted); padding:6px 0;">📅 Ngày vào ở:</td><td><strong>${formatDate(contract.ngayBatDau)}</strong></td></tr>
                    <tr><td style="color:var(--text-muted); padding:6px 0;">⏳ Đến hạn:</td><td><strong style="color:var(--warning)">${formatDate(contract.ngayKetThuc)}</strong></td></tr>
                    <tr><td style="color:var(--text-muted); padding:6px 0; border-top:1px dashed var(--border); padding-top:10px;">⚡ Số điện:</td><td style="border-top:1px dashed var(--border); padding-top:10px;"><strong style="color:var(--primary-light)">${dienHienTai}</strong> <span style="font-size:11px; color:var(--text-muted)">(Hiện tại)</span></td></tr>
                    <tr><td style="color:var(--text-muted); padding:6px 0; padding-bottom:10px; border-bottom:1px dashed var(--border);">💧 Số nước:</td><td style="padding-bottom:10px; border-bottom:1px dashed var(--border);"><strong style="color:var(--info)">${nuocHienTai}</strong> <span style="font-size:11px; color:var(--text-muted)">(Hiện tại)</span></td></tr>
                    <tr><td style="color:var(--text-muted); padding:10px 0 6px;">💰 Giá chốt HĐ:</td><td><strong style="color:var(--primary-light); font-size:16px">${formatCurrency(contract.giaThueHopDong)} / tháng</strong></td></tr>
                    <tr><td style="color:var(--text-muted); padding:6px 0;">💵 Đã đặt cọc:</td><td><strong>${formatCurrency(contract.tienCoc)}</strong></td></tr>
                    <tr><td style="color:var(--text-muted); padding:6px 0;">📝 Ghi chú HĐ:</td><td><strong>${contract.ghiChu || '—'}</strong></td></tr>
                `;
            } else {
                currentContract = null;
                if (btnBoSung) btnBoSung.style.display = 'none';
                document.getElementById('ct-khach-body').innerHTML = `<tr><td colspan="2" style="color:var(--danger)">Lỗi: Không khớp Hợp Đồng!</td></tr>`;
                document.getElementById('ct-hopdong-body').innerHTML = `<tr><td colspan="2" style="color:var(--danger)">Lỗi: Không khớp Hợp Đồng!</td></tr>`;
            }
        }
    } else {
        currentContract = null;
        if (btnBoSung) btnBoSung.style.display = 'none';
        document.getElementById('ct-khach-body').innerHTML = `<tr><td colspan="2" style="text-align:center; padding:15px; color:var(--text-muted)">💤 Phòng đang trống (Chưa có khách)</td></tr>`;
        document.getElementById('ct-hopdong-body').innerHTML = `<tr><td colspan="2" style="text-align:center; padding:15px; color:var(--text-muted)">💤 Không có hợp đồng</td></tr>`;
    }
}

async function chupAnhChiTietPhong() {
    const btn = document.getElementById('btn-chup-anh');
    const area = document.getElementById('chitiet-capture-area');
    if (!area || typeof html2canvas === 'undefined') {
        showToast('Thư viện chưa tải xong, thử lại nhé!', 'warning');
        return;
    }

    const original = btn.innerHTML;
    btn.innerHTML = '⏳ Đang chụp...';
    btn.disabled = true;

    try {
        const canvas = await html2canvas(area, {
            backgroundColor: '#1e1e2e',
            scale: 2,
            useCORS: true,
            logging: false
        });

        canvas.toBlob(async (blob) => {
            try {
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                showToast('✅ Đã copy ảnh! Nhấn Ctrl+V trong Zalo để gửi.', 'success');
            } catch {
                // Fallback: tải xuống
                const link = document.createElement('a');
                link.download = `chitiet-phong-${Date.now()}.png`;
                link.href = canvas.toDataURL();
                link.click();
                showToast('Đã tải xuống ảnh! (Trình duyệt không hỗ trợ Copy)', 'info');
            }
        }, 'image/png');
    } catch (e) {
        showToast('Lỗi chụp ảnh: ' + e.message, 'error');
    } finally {
        btn.innerHTML = original;
        btn.disabled = false;
    }
}

// ===== Bổ Sung Khách Thuê =====
async function openModalBoSungKhach() {
    if (!currentContract) return;

    // Khởi tạo danh sách đã chọn = khách đang có trong hợp đồng
    selectedKhachIds = new Set((currentContract.khachThues || []).map(k => k.id));
    document.getElementById('search-khach-bosung').value = '';
    document.getElementById('btn-luu-bosung').disabled = true;
    document.getElementById('danh-sach-khach-bosung').innerHTML = '<div class="loading-spinner" style="margin:20px auto;"></div>';

    openModal('modal-bo-sung-khach');

    const res = await api.get('/khach-thue');
    if (res.success) {
        allKhachBoSungList = res.data;
        renderKhachBoSung(allKhachBoSungList);
    } else {
        document.getElementById('danh-sach-khach-bosung').innerHTML = `<div style="text-align:center; color:var(--danger); padding:20px;">❌ ${res.message}</div>`;
    }
}

function filterKhachBoSung() {
    const kw = document.getElementById('search-khach-bosung').value.toLowerCase();
    const filtered = allKhachBoSungList.filter(k =>
        k.hoTen.toLowerCase().includes(kw) ||
        (k.soDienThoai || '').includes(kw) ||
        (k.cccd || '').includes(kw)
    );
    renderKhachBoSung(filtered);
}

function renderKhachBoSung(list) {
    const container = document.getElementById('danh-sach-khach-bosung');
    if (!list.length) {
        container.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:20px;">Không tìm thấy khách nào</div>';
        return;
    }

    const existingIds = new Set((currentContract.khachThues || []).map(k => k.id));

    container.innerHTML = list.map(k => {
        const isExisting = existingIds.has(k.id);
        const isSelected = selectedKhachIds.has(k.id);
        return `
            <label style="display:flex; align-items:center; gap:12px; padding:10px 12px;
                background:var(--bg-card); border-radius:8px; cursor:${isExisting ? 'default' : 'pointer'};
                border:1px solid ${isExisting ? 'var(--success)' : 'var(--border)'}; transition:all 0.2s;">
                <input type="checkbox" ${isSelected ? 'checked' : ''} ${isExisting ? 'disabled' : ''}
                    onchange="toggleKhachBoSung(${k.id}, this.checked)"
                    style="width:16px; height:16px; cursor:${isExisting ? 'default' : 'pointer'};">
                <div style="flex:1;">
                    <div style="font-weight:600; color:${isExisting ? 'var(--success)' : 'var(--text)'}">
                        👤 ${k.hoTen}
                        ${isExisting ? '<span style="font-size:11px; background:var(--success); color:#fff; padding:1px 6px; border-radius:10px; margin-left:6px;">Đã có trong HĐ</span>' : ''}
                    </div>
                    <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">
                        📞 ${k.soDienThoai || '—'} • 🪪 ${k.cccd || '—'}
                    </div>
                </div>
            </label>
        `;
    }).join('');
}

function toggleKhachBoSung(khachId, checked) {
    if (checked) {
        selectedKhachIds.add(khachId);
    } else {
        selectedKhachIds.delete(khachId);
    }
    // Chỉ bật nút Lưu khi có khách mới được chọn (không phải chỉ có khách cũ)
    const existingIds = new Set((currentContract.khachThues || []).map(k => k.id));
    const hasNew = [...selectedKhachIds].some(id => !existingIds.has(id));
    document.getElementById('btn-luu-bosung').disabled = !hasNew;
}

async function luuBoSungKhach() {
    if (!currentContract) return;

    const btn = document.getElementById('btn-luu-bosung');
    btn.disabled = true;
    btn.innerHTML = '⏳ Đang lưu...';

    const khachThues = [...selectedKhachIds].map(id => ({ id }));

    const body = {
        ngayKetThuc: currentContract.ngayKetThuc,
        giaThueHopDong: currentContract.giaThueHopDong,
        tienCoc: currentContract.tienCoc,
        ngayTraTien: currentContract.ngayTraTien,
        chiSoDienBanDau: currentContract.chiSoDienBanDau,
        chiSoNuocBanDau: currentContract.chiSoNuocBanDau,
        trangThai: currentContract.trangThai,
        ghiChu: currentContract.ghiChu,
        khachThues: khachThues
    };

    const res = await api.put(`/hop-dong/${currentContract.id}`, body);
    if (res.success) {
        showToast('✅ Bổ sung khách thành công!', 'success');
        closeModal('modal-bo-sung-khach');
        // Reload lại chi tiết phòng để cập nhật danh sách khách
        xemChiTietPhong(currentContract.phong.id);
    } else {
        showToast(res.message, 'error');
        btn.disabled = false;
        btn.innerHTML = '✅ Lưu bổ sung';
    }
}
