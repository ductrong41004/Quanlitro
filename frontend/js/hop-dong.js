let hopDongList = [];
let availablePhong = [];
let allKhach = [];

// Config giá điện/nước (sẽ làm mới từ API)
let ktGiaDien = 3500;
let ktGiaNuoc = 15000;

(async function initConfig() {
    try {
        const res = await api.get('/cau-hinh');
        if (res && res.success) {
            if (res.data.cfgGiaDien) ktGiaDien = parseInt(res.data.cfgGiaDien);
            if (res.data.cfgGiaNuoc) ktGiaNuoc = parseInt(res.data.cfgGiaNuoc);
        }
    } catch(e) {}
})();

let currentKetThucHopDong = null; // HĐ đang chờ kết thúc

async function loadDanhSachHopDong() {
    const trangThai = document.getElementById('filter-hd-trang-thai').value;
    let url = '/hop-dong';
    if (trangThai) url += `?trangThai=${trangThai}`;

    const res = await api.get(url);
    const tbody = document.getElementById('hd-tbody');
    
    if (!res.success) {
        showToast(res.message, 'error');
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${res.message}</td></tr>`;
        return;
    }

    hopDongList = res.data;
    renderHopDong(hopDongList);
}

function filterHopDongLocally() {
    const kw = document.getElementById('search-hd').value.toLowerCase();
    const filtered = hopDongList.filter(hd => 
        hd.phong.soPhong.toLowerCase().includes(kw) || 
        (hd.phong.khuVuc && hd.phong.khuVuc.toLowerCase().includes(kw)) ||
        hd.khachThues.some(k => k.hoTen.toLowerCase().includes(kw))
    );
    renderHopDong(filtered);
}

function renderHopDong(list) {
    const tbody = document.getElementById('hd-tbody');
    if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">📋</div><h3>Không có hợp đồng nào</h3></div></td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(hd => {
        let actionBtns = `<button class="btn btn-ghost btn-sm" onclick="openModalHopDong(${hd.id})">Sửa</button>`;
        if (hd.trangThai === 'DANG_HIEU_LUC') {
            actionBtns += `<button class="btn btn-ghost btn-sm" style="color:var(--warning)" onclick="openKetThucModal(${hd.id})">🔚 Kết thúc HĐ</button>`;
        } else if (hd.trangThai === 'DA_KET_THUC') {
            actionBtns += `<button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="xoaMem(${hd.id})">🗑️ Xóa</button>`;
        } else if (hd.trangThai === 'DA_HUY') {
            actionBtns += `<button class="btn btn-ghost btn-sm" style="color:var(--danger); opacity:0.7" onclick="xoaVinhVien(${hd.id})">❌ Xóa vĩnh viễn</button>`;
        }

        return `
            <tr>
                <td data-label="Phòng">
                    <strong>Phòng ${hd.phong.soPhong}</strong>
                    ${hd.phong.khuVuc ? `<div style="font-size:12px; color:var(--text-muted); margin-top:2px">Khu ${hd.phong.khuVuc}</div>` : ''}
                </td>
                <td data-label="Khách thuê">
                    <div style="font-weight:600; color:var(--success)">${hd.khachThues.map(k=>k.hoTen).join(' • ') || 'Chưa có'}</div>
                    <div style="font-size:12px; color:var(--text-muted)">Đại diện: ${hd.khachThues.length > 0 ? (hd.khachThues[0].soDienThoai || 'Không sđt') : ''}</div>
                </td>
                <td data-label="Thời hạn">
                    <div>Từ: ${formatDate(hd.ngayBatDau)}</div>
                    <div>Đến: ${formatDate(hd.ngayKetThuc)}</div>
                    ${hd.ngayKetThucThucTe ? `<div style="color:var(--danger); font-size:11px">Thực tế: ${formatDate(hd.ngayKetThucThucTe)}</div>` : ''}
                </td>
                <td data-label="Giá / Cọc">
                    <div style="color:var(--primary-light)">Giá: ${formatCurrency(hd.giaThueHopDong)}</div>
                    <div style="font-size:12px; color:var(--text-muted)">Cọc: ${formatCurrency(hd.tienCoc)}</div>
                </td>
                <td data-label="Trạng thái">${trangThaiHopDongBadge(hd.trangThai)}</td>
                <td class="td-actions"><div style="display:flex; gap:4px">${actionBtns}</div></td>
            </tr>
        `;
    }).join('');
}

async function prepareFormData(editContractId = null) {
    const [resPhong, resKhach] = await Promise.all([
        api.get('/phong?trangThai=TRONG'),
        api.get('/khach-thue')
    ]);
    if (resPhong.success) availablePhong = resPhong.data;
    if (resKhach.success) allKhach = resKhach.data;

    const selectPhong = document.getElementById('hd-phong');

    // Sắp xếp phòng theo khu vực rồi theo số phòng
    const sorted = [...availablePhong].sort((a, b) => {
        const kvA = (a.khuVuc || '').toUpperCase();
        const kvB = (b.khuVuc || '').toUpperCase();
        if (kvA !== kvB) return kvA.localeCompare(kvB);
        return a.soPhong.localeCompare(b.soPhong, undefined, { numeric: true });
    });

    // Nhóm theo khu vực
    const grouped = {};
    sorted.forEach(p => {
        const kv = p.khuVuc ? `Khu ${p.khuVuc}` : 'Không rõ khu';
        if (!grouped[kv]) grouped[kv] = [];
        grouped[kv].push(p);
    });

    // Render optgroup
    let html = `<option value="">-- Chọn phòng trống --</option>`;
    Object.keys(grouped).sort().forEach(kv => {
        html += `<optgroup label="📍 ${kv}">`;
        grouped[kv].forEach(p => {
            const kvLabel = p.khuVuc ? `Khu ${p.khuVuc} - ` : '';
            html += `<option value="${p.id}" data-gia="${p.giaThue}" data-dien="${p.chiSoDien !== null ? p.chiSoDien : ''}" data-nuoc="${p.chiSoNuoc !== null ? p.chiSoNuoc : ''}">${kvLabel}Phòng ${p.soPhong} (${formatCurrency(p.giaThue)}/th)</option>`;
        });
        html += `</optgroup>`;
    });
    selectPhong.innerHTML = html;

    // Logic kiểm tra khách đã có chỗ
    const activeContracts = hopDongList.filter(hd => hd.trangThai === 'DANG_HIEU_LUC' && hd.id !== editContractId);
    const tenantRoomMap = {}; 
    activeContracts.forEach(hd => {
        const roomStr = (hd.phong.khuVuc ? 'Khu '+hd.phong.khuVuc+' - ' : '') + 'Phòng ' + hd.phong.soPhong;
        hd.khachThues.forEach(k => {
            tenantRoomMap[k.id] = roomStr;
        });
    });

    const listKhach = document.getElementById('hd-khach-list');
    
    // Lọc ra danh sách khách trống (hoặc khách đang thuộc hợp đồng hiện tại nếu đang edit)
    const availableKhach = allKhach.filter(k => !tenantRoomMap[k.id]);

    if (availableKhach.length === 0) {
        listKhach.innerHTML = `<div style="padding:10px; color:var(--text-muted); font-size:13px; text-align:center; font-style: italic;">Không còn khách thuê nào tự do</div>`;
    } else {
        listKhach.innerHTML = availableKhach.map(k => {
            return `
            <label class="hd-khach-item" data-name="${k.hoTen.toLowerCase()}" style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:14px; padding: 4px 0;">
                <input type="checkbox" name="hd_khach_id" value="${k.id}">
                <span>${k.hoTen} <small style="color:var(--text-muted)">(${k.cccd || k.soDienThoai || 'Chưa có SĐT'})</small></span>
            </label>
            `;
        }).join('');
    }
}

// Auto fill price and meters when selecting room
document.getElementById('hd-phong').addEventListener('change', (e) => {
    const sel = e.target;
    if(sel.selectedIndex > 0) {
        const option = sel.options[sel.selectedIndex];
        document.getElementById('hd-gia-thue').value = formatMoney(option.dataset.gia || 0);
        document.getElementById('hd-dien-bd').value = option.dataset.dien || '';
        document.getElementById('hd-nuoc-bd').value = option.dataset.nuoc || '';
    } else {
        document.getElementById('hd-gia-thue').value = '';
        document.getElementById('hd-dien-bd').value = '';
        document.getElementById('hd-nuoc-bd').value = '';
    }
});

async function openModalHopDong(id = null) {
    await prepareFormData(id);
    const title = document.getElementById('modal-hd-title');
    const form = document.getElementById('form-hd');

    const searchInput = document.getElementById('search-khach-hop-dong');
    if (searchInput) {
        searchInput.value = '';
        filterKhachOnHopDongModal();
    }
    
    // Default dates
    const today = new Date();
    const nextYear = new Date();
    nextYear.setFullYear(today.getFullYear() + 1);

    if (id) {
        title.textContent = 'Sửa hợp đồng';
        const hd = hopDongList.find(x => x.id === id);
        if(!hd) return;
        
        // Nếu đang sửa thì cấy thêm phòng hiện tại vào đúng optgroup khu vực
        const pSel = document.getElementById('hd-phong');
        const curKv = hd.phong.khuVuc ? `Khu ${hd.phong.khuVuc}` : 'Không rõ khu';
        const curOption = `<option value="${hd.phong.id}" data-gia="${hd.giaThueHopDong}" selected>Phòng ${hd.phong.soPhong} (Đang ở)</option>`;
        // Tìm optgroup đúng khu vực để chèn vào, nếu không có thì tạo mới
        let targetGroup = Array.from(pSel.querySelectorAll('optgroup')).find(g => g.label === `📍 ${curKv}`);
        if (!targetGroup) {
            targetGroup = document.createElement('optgroup');
            targetGroup.label = `📍 ${curKv}`;
            pSel.insertBefore(targetGroup, pSel.querySelector('optgroup') || null);
        }
        targetGroup.insertAdjacentHTML('afterbegin', curOption);
        pSel.disabled = false; // Cho phép đổi phòng
        
        const checkboxes = document.querySelectorAll('input[name="hd_khach_id"]');
        const khachIds = hd.khachThues.map(k => k.id);
        checkboxes.forEach(cb => {
            cb.checked = khachIds.includes(parseInt(cb.value));
            // Cho phép Sửa khách tự do trên hợp đồng cũ
            cb.disabled = false;
        });

        document.getElementById('hd-id').value = hd.id;
        document.getElementById('hd-ngay-bd').value = hd.ngayBatDau;
        document.getElementById('hd-ngay-bd').readOnly = true; // start date fixed
        document.getElementById('hd-ngay-kt').value = hd.ngayKetThuc || '';
        document.getElementById('hd-gia-thue').value = formatMoney(hd.giaThueHopDong);
        document.getElementById('hd-tien-coc').value = formatMoney(hd.tienCoc);
        document.getElementById('hd-ngay-tra').value = hd.ngayTraTien || 5;
        document.getElementById('hd-dien-bd').value = hd.chiSoDienBanDau || 0;
        document.getElementById('hd-nuoc-bd').value = hd.chiSoNuocBanDau || 0;
        document.getElementById('hd-ghi-chu').value = hd.ghiChu || '';
    } else {
        title.textContent = 'Tạo hợp đồng mới';
        form.reset();
        document.getElementById('hd-id').value = '';
        document.getElementById('hd-phong').disabled = false;
        document.querySelectorAll('input[name="hd_khach_id"]').forEach(cb => {
            cb.checked = false;
            cb.disabled = false;
        });
        document.getElementById('hd-ngay-bd').readOnly = false;
        
        // defaults
        document.getElementById('hd-ngay-bd').valueAsDate = today;
        document.getElementById('hd-ngay-kt').valueAsDate = nextYear;
        document.getElementById('hd-ngay-tra').value = '5';
        document.getElementById('hd-dien-bd').value = '';
        document.getElementById('hd-nuoc-bd').value = '';
    }
    openModal('modal-hd');
}

async function saveHopDong() {
    const id = document.getElementById('hd-id').value;
    const checkedBoxes = Array.from(document.querySelectorAll('input[name="hd_khach_id"]:checked'));
    
    if (checkedBoxes.length === 0) {
        showToast('Hợp đồng phải có ít nhất 1 khách thuê!', 'warning');
        return;
    }

    const body = {
        ngayKetThuc: document.getElementById('hd-ngay-kt').value || null,
        giaThueHopDong: parseNum(document.getElementById('hd-gia-thue').value),
        tienCoc: parseNum(document.getElementById('hd-tien-coc').value),
        chiSoDienBanDau: parseNum(document.getElementById('hd-dien-bd').value) || 0,
        chiSoNuocBanDau: parseNum(document.getElementById('hd-nuoc-bd').value) || 0,
        ngayTraTien: parseInt(document.getElementById('hd-ngay-tra').value) || 5,
        ghiChu: document.getElementById('hd-ghi-chu').value.trim(),
        khachThues: checkedBoxes.map(cb => ({ id: parseInt(cb.value) }))
    };

    const executeSave = async () => {
        let res;
        body.phong = { id: document.getElementById('hd-phong').value }; // Inject chosen id anyway
        
        if (id) {
            // Edit
            res = await api.put(`/hop-dong/${id}`, body);
        } else {
            // Create
            body.ngayBatDau = document.getElementById('hd-ngay-bd').value;
            if(!body.phong.id || !body.ngayBatDau || !body.giaThueHopDong) {
                showToast('Vui lòng điền các trường bắt buộc (*)', 'warning');
                return;
            }
            body.trangThai = 'DANG_HIEU_LUC';
            res = await api.post('/hop-dong', body);
        }

        if (res && res.success) {
            showToast(res.message, 'success');
            closeModal('modal-hd');
            loadDanhSachHopDong();
        } else if (res) {
            showToast(res.message, 'error');
        }
    };

    if (id) {
        // Checking for changes in Edit Mode
        const hd = hopDongList.find(x => x.id == id);
        const oldIds = hd.khachThues.map(k => k.id);
        const newIds = checkedBoxes.map(cb => parseInt(cb.value));

        const addedIds = newIds.filter(x => !oldIds.includes(x));
        const removedIds = oldIds.filter(x => !newIds.includes(x));
        
        const oldPhongId = hd.phong.id;
        const newPhongId = parseInt(document.getElementById('hd-phong').value);

        let hasChanges = false;
        let msgText = 'Xác nhận thay đổi nhạy cảm:\n\n';

        if (oldPhongId !== newPhongId) {
            const pSelect = document.getElementById('hd-phong');
            const newPhongName = pSelect.options[pSelect.selectedIndex].text.split(' (')[0];
            msgText += `🔄 Chuyển phòng: Từ Phòng ${hd.phong.soPhong} ➔ ${newPhongName}\n`;
            hasChanges = true;
        }

        if (addedIds.length > 0) {
            const names = addedIds.map(x => allKhach.find(k => k.id === x)?.hoTen || '').join(', ');
            msgText += `[+] Thêm vào HĐ: ${names}\n`;
            hasChanges = true;
        }
        if (removedIds.length > 0) {
            const names = removedIds.map(x => allKhach.find(k => k.id === x)?.hoTen || '').join(', ');
            msgText += `[-] Loại bỏ: ${names}\n`;
            hasChanges = true;
        }

        if (hasChanges) {
            msgText += '\nBạn chắc chắn muốn LƯU nội dung này chứ?';
            confirmAction(msgText, executeSave);
        } else {
            executeSave();
        }
    } else {
        executeSave();
    }
}

function ketThucHopDong(id) {
    confirmAction('Xác nhận kết thúc hợp đồng này (Khách trả phòng)? Phòng sẽ được chuyển sang trạng thái trống.', async () => {
        const res = await api.put(`/hop-dong/${id}/ket-thuc`, {});
        if (res.success) {
            showToast(res.message, 'success');
            loadDanhSachHopDong();
        } else {
            showToast(res.message, 'error');
        }
    });
}

// ===== KẺT THÚC HỢP ĐỒNG & HOÀN CỌC =====
async function openKetThucModal(id) {
    const hd = hopDongList.find(x => x.id === id);
    if (!hd) return;
    currentKetThucHopDong = hd;

    // Điền thông tin cơ bản
    document.getElementById('kt-phong-info').textContent =
        `Phòng ${hd.phong.soPhong}${hd.phong.khuVuc ? ' — Khu ' + hd.phong.khuVuc : ''}`;
    document.getElementById('kt-khach-info').textContent =
        'Khách: ' + (hd.khachThues.map(k => k.hoTen).join(', ') || 'Chưa có');
    document.getElementById('kt-tien-coc').textContent =
        (hd.tienCoc > 0 ? formatCurrency(hd.tienCoc) : 'Không có cọc');

    // Load chỉ số cũ từ API
    document.getElementById('kt-dien-cu').value = '...';
    document.getElementById('kt-nuoc-cu').value = '...';
    try {
        const res = await api.get('/hoa-don/chi-so-cu?phongId=' + hd.phong.id);
        if (res.success) {
            document.getElementById('kt-dien-cu').value = res.data.dien ?? 0;
            document.getElementById('kt-nuoc-cu').value = res.data.nuoc ?? 0;
        }
    } catch(e) {
        document.getElementById('kt-dien-cu').value = 0;
        document.getElementById('kt-nuoc-cu').value = 0;
    }

    // Reset ô nhập mới
    document.getElementById('kt-dien-moi').value = '';
    document.getElementById('kt-nuoc-moi').value = '';
    document.getElementById('kt-gia-dien').value = formatMoney(ktGiaDien);
    document.getElementById('kt-gia-nuoc').value = formatMoney(ktGiaNuoc);
    document.getElementById('kt-ngay-o-them').value = '0';
    document.getElementById('kt-gia-thue-ngay').value = '0';
    document.getElementById('kt-result-box').style.display = 'none';
    document.getElementById('kt-row-o-them').style.display = 'none';
    document.getElementById('kt-canh-bao-no').style.display = 'none';

    openModal('modal-ket-thuc');
}

function tinhHoanCoc() {
    if (!currentKetThucHopDong) return;

    const dienCu  = parseNum(document.getElementById('kt-dien-cu').value);
    const dienMoi = parseNum(document.getElementById('kt-dien-moi').value);
    const nuocCu  = parseNum(document.getElementById('kt-nuoc-cu').value);
    const nuocMoi = parseNum(document.getElementById('kt-nuoc-moi').value);
    const giaDien = parseNum(document.getElementById('kt-gia-dien').value);
    const giaNuoc = parseNum(document.getElementById('kt-gia-nuoc').value);
    const ngayOThem = parseInt(document.getElementById('kt-ngay-o-them').value) || 0;
    const giaThueNgay = parseNum(document.getElementById('kt-gia-thue-ngay').value);
    const tienCoc = parseNum(currentKetThucHopDong.tienCoc);

    // Chưa nhập đủ thì không hiển thị
    if (!document.getElementById('kt-dien-moi').value &&
        !document.getElementById('kt-nuoc-moi').value) {
        document.getElementById('kt-result-box').style.display = 'none';
        return;
    }

    const soDien = Math.max(0, dienMoi - dienCu);
    const soNuoc = Math.max(0, nuocMoi - nuocCu);
    const tienDien = soDien * giaDien;
    const tienNuoc = soNuoc * giaNuoc;
    const tienOThem = ngayOThem > 0 ? ngayOThem * giaThueNgay : 0;
    const khauTru  = tienDien + tienNuoc + tienOThem;
    const hoanTra  = tienCoc - khauTru;

    document.getElementById('kt-so-dien').textContent = soDien.toFixed(1);
    document.getElementById('kt-so-nuoc').textContent = soNuoc.toFixed(1);
    document.getElementById('kt-tien-dien').textContent = '- ' + formatCurrency(tienDien);
    document.getElementById('kt-tien-nuoc').textContent = '- ' + formatCurrency(tienNuoc);

    // Hiển thị dòng ở thêm nếu có
    const rowOThem = document.getElementById('kt-row-o-them');
    if (ngayOThem > 0 && giaThueNgay > 0) {
        document.getElementById('kt-so-ngay-o-them').textContent = ngayOThem;
        document.getElementById('kt-tien-o-them').textContent = '- ' + formatCurrency(tienOThem);
        rowOThem.style.display = 'flex';
    } else {
        rowOThem.style.display = 'none';
    }

    const hoanTraEl = document.getElementById('kt-hoan-tra');
    if (hoanTra >= 0) {
        hoanTraEl.textContent = formatCurrency(hoanTra);
        hoanTraEl.style.color = 'var(--success)';
        document.getElementById('kt-canh-bao-no').style.display = 'none';
    } else {
        hoanTraEl.textContent = '- ' + formatCurrency(Math.abs(hoanTra));
        hoanTraEl.style.color = 'var(--danger)';
        document.getElementById('kt-canh-bao-no').style.display = 'block';
    }
    document.getElementById('kt-result-box').style.display = 'block';
}

async function xacNhanKetThuc() {
    if (!currentKetThucHopDong) return;
    const id = currentKetThucHopDong.id;
    const dienMoi = parseNum(document.getElementById('kt-dien-moi').value) || null;
    const nuocMoi = parseNum(document.getElementById('kt-nuoc-moi').value) || null;

    const body = {};
    if (dienMoi !== null && dienMoi > 0) body.chiSoDienMoi = dienMoi;
    if (nuocMoi !== null && nuocMoi > 0) body.chiSoNuocMoi = nuocMoi;

    const res = await api.put(`/hop-dong/${id}/ket-thuc`, body);
    if (res.success) {
        showToast('Đã kết thúc hợp đồng thành công! Phòng đã chuyển sang Trống.', 'success');
        
        // --- Hiển thị Bill Hoàn Cọc ---
        const d = new Date();
        document.getElementById('bill-ngay-lap').textContent = 
            `Ngày lập: ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} - ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
        
        document.getElementById('bill-phong').textContent = document.getElementById('kt-phong-info').textContent;
        document.getElementById('bill-khach').textContent = document.getElementById('kt-khach-info').textContent;
        document.getElementById('bill-tien-coc').textContent = document.getElementById('kt-tien-coc').textContent;
        
        document.getElementById('bill-dien-cu').textContent = document.getElementById('kt-dien-cu').value || 0;
        document.getElementById('bill-dien-moi').textContent = document.getElementById('kt-dien-moi').value || 0;
        document.getElementById('bill-so-dien').textContent = document.getElementById('kt-so-dien').textContent;
        document.getElementById('bill-gia-dien').textContent = document.getElementById('kt-gia-dien').value;
        document.getElementById('bill-tien-dien').textContent = document.getElementById('kt-tien-dien').textContent;

        document.getElementById('bill-nuoc-cu').textContent = document.getElementById('kt-nuoc-cu').value || 0;
        document.getElementById('bill-nuoc-moi').textContent = document.getElementById('kt-nuoc-moi').value || 0;
        document.getElementById('bill-so-nuoc').textContent = document.getElementById('kt-so-nuoc').textContent;
        document.getElementById('bill-gia-nuoc').textContent = document.getElementById('kt-gia-nuoc').value;
        document.getElementById('bill-tien-nuoc').textContent = document.getElementById('kt-tien-nuoc').textContent;

        // Thêm ở thêm vào bill
        const ngayOThem = parseInt(document.getElementById('kt-ngay-o-them').value) || 0;
        const giaThueNgay = parseNum(document.getElementById('kt-gia-thue-ngay').value);
        const rowOThemBill = document.getElementById('bill-row-o-them');
        if (ngayOThem > 0 && giaThueNgay > 0) {
            document.getElementById('bill-so-ngay-o-them').textContent = ngayOThem;
            document.getElementById('bill-tien-o-them').textContent = document.getElementById('kt-tien-o-them').textContent;
            document.getElementById('bill-so-ngay-o-them-2').textContent = ngayOThem;
            document.getElementById('bill-gia-thue-ngay').textContent = document.getElementById('kt-gia-thue-ngay').value;
            rowOThemBill.style.display = 'block';
        } else {
            rowOThemBill.style.display = 'none';
        }

        const hoanTraEl = document.getElementById('kt-hoan-tra');
        const billHoanTraEl = document.getElementById('bill-hoan-tra');
        billHoanTraEl.textContent = hoanTraEl.textContent;
        billHoanTraEl.style.color = hoanTraEl.style.color; // Copy color (màu xanh hoặc đỏ)

        closeModal('modal-ket-thuc');
        openModal('modal-bill-hoan-coc');
        
        currentKetThucHopDong = null;
        loadDanhSachHopDong();
    } else {
        showToast(res.message, 'error');
    }
}

async function copyBillHoanCoc() {
    const el = document.getElementById('bill-hoan-coc-content');
    try {
        const h2c = html2canvas || window.html2canvas;
        if (!h2c) {
            showToast('Chưa tải được thư viện chụp ảnh!', 'error');
            return;
        }
        const canvas = await h2c(el, { scale: 2, backgroundColor: '#1a1f35' });
        canvas.toBlob(async function(blob) {
            try {
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                showToast('Đã copy Biên lai trả phòng vào khay nhớ tạm! Nhấn Ctrl+V để dán.', 'success');
            } catch (err) {
                showToast('Trình duyệt của bạn không hỗ trợ copy ảnh trực tiếp, hoặc chưa được cấp quyền!', 'error');
            }
        });
    } catch(err) {
        showToast('Lỗi tạo ảnh biên lai!', 'error');
    }
}

// Xóa mềm (soft delete): DA_KET_THUC → DA_HUY
function xoaMem(id) {
    confirmAction('🗑️ Chuyển hợp đồng này sang "Xóa gần đây"?\n\nHợp đồng vẫn được lưu trong hệ thống, bạn có thể lậc theo "Xóa gần đây" để xem lại.', async () => {
        const res = await api.delete(`/hop-dong/${id}`);
        if (res.success) {
            showToast('Đã chuyển hợp đồng sang "Xóa gần đây".', 'success');
            loadDanhSachHopDong();
        } else {
            showToast(res.message, 'error');
        }
    });
}

// Xóa vĩnh viễn (hard delete): DA_HUY → xóa khỏi DB
function xoaVinhVien(id) {
    confirmAction('⚠️ Xóa Vĩnh Viễn hợp đồng này?\n\nHành động này KHÔNG THỂ hoàn tác, dữ liệu sẽ mất hoàn toàn!', async () => {
        const res = await api.delete(`/hop-dong/${id}/vinh-vien`);
        if (res.success) {
            showToast('Đã xóa vĩnh viễn hợp đồng.', 'success');
            loadDanhSachHopDong();
        } else {
            showToast(res.message, 'error');
        }
    });
}

// Init
loadDanhSachHopDong();

function filterKhachOnHopDongModal() {
    const kw = document.getElementById('search-khach-hop-dong').value.toLowerCase();
    document.querySelectorAll('.hd-khach-item').forEach(label => {
        const name = label.getAttribute('data-name');
        if (name.includes(kw)) {
            label.style.display = 'flex';
        } else {
            label.style.display = 'none';
        }
    });
}

// Khởi tạo format tiền cho các ô nhập hợp đồng
applyMoneyInput(document.getElementById('hd-gia-thue'), { autoScale: true });
applyMoneyInput(document.getElementById('hd-tien-coc'), { autoScale: true });

// Format cho ô giá điện/nước ở modal hoàn cọc
setTimeout(() => {
    applyMoneyInput(document.getElementById('kt-gia-dien'), { autoScale: false, onUpdate: () => tinhHoanCoc() });
    applyMoneyInput(document.getElementById('kt-gia-nuoc'), { autoScale: false, onUpdate: () => tinhHoanCoc() });
    applyMoneyInput(document.getElementById('kt-gia-thue-ngay'), { autoScale: false, onUpdate: () => tinhHoanCoc() });
}, 100);

