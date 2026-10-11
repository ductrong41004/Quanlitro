let hoadonList = [];
let availablePhong = [];
let allContracts = [];

// ===== Lấy số ngày thực tế của tháng (vd: tháng 2 = 28/29, tháng 4 = 30, ...) =====
function daysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
}

function parseDateToString(d) {
    if (!d) return '';
    if (Array.isArray(d)) {
        return `${d[0]}-${String(d[1]).padStart(2,'0')}-${String(d[2]).padStart(2,'0')}`;
    }
    return d; // already YYYY-MM-DD
}

// ===== Tính nhãn kỳ: "NgàyTraTiền tháng trước → NgàyTraTiền tháng này" =====
function getPeriodLabel(hd) {
    if (hd && hd.tuNgay && hd.denNgay) {
        const tu = parseDateToString(hd.tuNgay);
        const den = parseDateToString(hd.denNgay);
        const fmt = d => `${d.split('-')[2]}/${d.split('-')[1]}/${d.split('-')[0]}`;
        return `${fmt(tu)} → ${fmt(den)}`;
    }

    const thang = hd ? hd.thang : new Date().getMonth() + 1;
    const nam = hd ? hd.nam : new Date().getFullYear();

    const contract = allContracts.find(c => c.phong && hd && hd.phong && c.phong.id === hd.phong.id);
    const ngayTraTien = contract?.ngayTraTien || null;
    if (!ngayTraTien) return null;

    // Ngày kết thúc = ngayTraTien của tháng hiện tại (clamp nếu tháng ít ngày)
    const endDay  = Math.min(ngayTraTien, daysInMonth(thang, nam));
    const endDate = new Date(nam, thang - 1, endDay);

    // Tháng trước
    let prevMonth = thang - 1;
    let prevYear  = nam;
    if (prevMonth === 0) { prevMonth = 12; prevYear--; }

    // Ngày bắt đầu = ngayTraTien của tháng trước (clamp)
    const startDay  = Math.min(ngayTraTien, daysInMonth(prevMonth, prevYear));
    const startDate = new Date(prevYear, prevMonth - 1, startDay);

    const fmt = d =>
        `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    return `${fmt(startDate)} → ${fmt(endDate)}`;
}

// Lấy startDate và endDate dạng YYYY-MM-DD
function getPeriodDates(phongId, thang, nam) {
    const contract = allContracts.find(c => c.phong && c.phong.id === parseInt(phongId));
    const ngayTraTien = contract?.ngayTraTien || null;
    if (!ngayTraTien) return { start: '', end: '' };

    const endDay  = Math.min(ngayTraTien, daysInMonth(thang, nam));
    let prevMonth = thang - 1;
    let prevYear  = nam;
    if (prevMonth === 0) { prevMonth = 12; prevYear--; }
    const startDay  = Math.min(ngayTraTien, daysInMonth(prevMonth, prevYear));

    const sM = String(prevMonth).padStart(2,'0');
    const sD = String(startDay).padStart(2,'0');
    const eM = String(thang).padStart(2,'0');
    const eD = String(endDay).padStart(2,'0');
    return { start: `${prevYear}-${sM}-${sD}`, end: `${nam}-${eM}-${eD}` };
}

// ===== Tải toàn bộ hợp đồng đang hiệu lực (dùng cho tra cứu kỳ) =====
async function loadAllContracts() {
    const res = await api.get('/hop-dong?trangThai=DANG_HIEU_LUC');
    if (res.success) allContracts = res.data;
}

let cfgGiaDien = 3500;
let cfgGiaNuoc = 15000;
let cfgTenTro = "KHU TRỌ CAO CẤP";
let cfgNganHang = "";
let cfgSoTaiKhoan = "";
let cfgTenChuTaiKhoan = "";
let cfg2NganHang = "";
let cfg2SoTaiKhoan = "";
let cfg2TenChuTaiKhoan = "";

async function loadConfig() {
    try {
        const res = await api.get('/cau-hinh');
        if (res && res.success) {
            const data = res.data;
            if (data.cfgTenTro) cfgTenTro = data.cfgTenTro;
            if (data.cfgGiaDien) cfgGiaDien = parseInt(data.cfgGiaDien);
            if (data.cfgGiaNuoc) cfgGiaNuoc = parseInt(data.cfgGiaNuoc);
            if (data.cfgNganHang) cfgNganHang = data.cfgNganHang;
            if (data.cfgSoTaiKhoan) cfgSoTaiKhoan = data.cfgSoTaiKhoan;
            if (data.cfgTenChuTaiKhoan) cfgTenChuTaiKhoan = data.cfgTenChuTaiKhoan;
            cfg2NganHang = data.cfg2NganHang || '';
            cfg2SoTaiKhoan = data.cfg2SoTaiKhoan || '';
            cfg2TenChuTaiKhoan = data.cfg2TenChuTaiKhoan || '';
        }
    } catch (e) {
        console.warn('Lỗi API cấu hình. Sử dụng mặc định', e);
    }

    const lblTen = document.getElementById('lbl-cfg-ten');
    const lblDien = document.getElementById('lbl-cfg-dien');
    const lblNuoc = document.getElementById('lbl-cfg-nuoc');
    const lblNH = document.getElementById('lbl-cfg-nh');
    
    if (lblTen) lblTen.textContent = cfgTenTro;
    if (lblDien) lblDien.textContent = formatCurrency(cfgGiaDien).replace(' đ', 'đ');
    if (lblNuoc) lblNuoc.textContent = formatCurrency(cfgGiaNuoc).replace(' đ', 'đ');
    if (lblNH) {
        if (cfgNganHang && cfgSoTaiKhoan) {
            lblNH.textContent = `${cfgNganHang} - ${cfgSoTaiKhoan}`;
            lblNH.style.color = 'var(--primary-light)';
        } else {
            lblNH.textContent = 'Chưa cài đặt';
            lblNH.style.color = 'var(--warning)';
        }
    }
}

function openConfigModal() {
    document.getElementById('cfg-ten-tro').value = cfgTenTro;
    document.getElementById('cfg-gian-dien').value = cfgGiaDien;
    document.getElementById('cfg-gia-nuoc').value = cfgGiaNuoc;
    document.getElementById('cfg-ngan-hang').value = cfgNganHang;
    document.getElementById('cfg-stk').value = cfgSoTaiKhoan;
    document.getElementById('cfg-ten-chu-tk').value = cfgTenChuTaiKhoan;
    document.getElementById('cfg2-ngan-hang').value = cfg2NganHang;
    document.getElementById('cfg2-stk').value = cfg2SoTaiKhoan;
    document.getElementById('cfg2-ten-chu-tk').value = cfg2TenChuTaiKhoan;
    openModal('modal-config');
}

async function saveConfig() {
    const ten = document.getElementById('cfg-ten-tro').value.trim() || "KHU TRỌ CAO CẤP";
    const dien = document.getElementById('cfg-gian-dien').value;
    const nuoc = document.getElementById('cfg-gia-nuoc').value;
    const nh = document.getElementById('cfg-ngan-hang').value.trim();
    const stk = document.getElementById('cfg-stk').value.trim();
    const chu = document.getElementById('cfg-ten-chu-tk').value.trim();
    const nh2 = document.getElementById('cfg2-ngan-hang').value.trim();
    const stk2 = document.getElementById('cfg2-stk').value.trim();
    const chu2 = document.getElementById('cfg2-ten-chu-tk').value.trim();
    
    const payload = {
        cfgTenTro: ten,
        cfgGiaDien: dien,
        cfgGiaNuoc: nuoc,
        cfgNganHang: nh,
        cfgSoTaiKhoan: stk,
        cfgTenChuTaiKhoan: chu,
        cfg2NganHang: nh2,
        cfg2SoTaiKhoan: stk2,
        cfg2TenChuTaiKhoan: chu2
    };
    
    try {
        const res = await api.post('/cau-hinh', payload);
        if (res && res.success) {
            showToast('Đã lưu cấu hình vào Database!', 'success');
        } else {
            showToast(res.message || 'Lỗi lưu cấu hình', 'error');
        }
    } catch (e) {
        console.warn('Lỗi API lưu cấu hình.', e);
        showToast('Không thể lưu vào Database', 'error');
    }
    
    await loadConfig();
    closeModal('modal-config');
}

function initFilters() {
    const d = new Date();
    const curMonth = d.getMonth() + 1;
    const curYear = d.getFullYear();

    const mSelect = document.getElementById('filter-thang');
    let mHtml = '<option value="">Tất cả tháng</option>';
    for (let i = 1; i <= 12; i++) {
        mHtml += `<option value="${i}" ${i === curMonth ? 'selected' : ''}>Tháng ${i}</option>`;
    }
    mSelect.innerHTML = mHtml;

    const ySelect = document.getElementById('filter-nam');
    let yHtml = '';
    for (let i = curYear - 2; i <= curYear + 1; i++) {
        yHtml += `<option value="${i}" ${i === curYear ? 'selected' : ''}>Năm ${i}</option>`;
    }
    ySelect.innerHTML = yHtml;
}

async function loadDanhSachHoaDon() {
    const thang = document.getElementById('filter-thang').value;
    const nam = document.getElementById('filter-nam').value;
    const trangThai = document.getElementById('filter-trang-thai').value;

    let url = '/hoa-don';
    let params = [];
    if (thang) params.push(`thang=${thang}`);
    if (nam) params.push(`nam=${nam}`);
    if (trangThai) params.push(`trangThai=${trangThai}`);
    if (params.length) url += '?' + params.join('&');

    const res = await api.get(url);
    const tbody = document.getElementById('hd-tbody');
    
    if (!res.success) {
        showToast(res.message, 'error');
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">${res.message}</td></tr>`;
        return;
    }

    hoadonList = res.data;
    hoadonList.sort((a,b) => b.nam === a.nam ? b.thang - a.thang : b.nam - a.nam);
    
    // Tự động phân tích các Khu vực đang có hóa đơn để tạo bộ lọc
    const areas = [...new Set(hoadonList.map(h => h.phong.khuVuc).filter(Boolean))].sort();
    const filterKV = document.getElementById('filter-khuvuc');
    if (filterKV) {
        const curVal = filterKV.value;
        filterKV.innerHTML = `<option value="">Tất cả khu vực</option>` + 
            areas.map(a => `<option value="${a}" ${a === curVal ? 'selected':''}>Khu ${a}</option>`).join('');
    }

    filterHoaDonLocally();
}

function filterHoaDonLocally() {
    const kw = document.getElementById('search-hoadon').value.toLowerCase();
    const kv = document.getElementById('filter-khuvuc') ? document.getElementById('filter-khuvuc').value : '';
    
    const filtered = hoadonList.filter(hd => {
        const matchKhuVuc = !kv || hd.phong.khuVuc === kv;
        const matchSearch = hd.phong.soPhong.toLowerCase().includes(kw);
        return matchKhuVuc && matchSearch;
    });
    renderHoaDon(filtered);
}

function renderHoaDon(list) {
    const tbody = document.getElementById('hd-tbody');
    if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">🧾</div><h3>Không có hóa đơn nào</h3></div></td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(hd => {
        const dien = (hd.chiSoDienMoi - hd.chiSoDienCu) * hd.donGiaDien;
        const nuoc = (hd.chiSoNuocMoi - hd.chiSoNuocCu) * hd.donGiaNuoc;
        const khac = hd.phiInternet + hd.phiRac + hd.phiGuiXe + hd.phiKhac;

        return `
            <tr style="cursor: pointer; transition: background 0.2s;" onclick="if(!event.target.closest('button')) xemChiTietHoaDon(${hd.id})" title="Nhấn để xem chi tiết hóa đơn">
                <td data-label="Phòng">
                    <strong>Phòng ${hd.phong.soPhong}</strong>
                    ${hd.phong.khuVuc ? `<div style="font-size:12px; color:var(--text-muted); margin-top:4px">Khu ${hd.phong.khuVuc}</div>` : ''}
                </td>
                <td data-label="Kỳ HĐ"><div style="font-weight:600">${hd.thang}/${hd.nam}</div></td>
                <td data-label="Tiền phòng">${formatCurrency(hd.tienPhong)}</td>
                <td data-label="Điện / Nước">
                    <div style="font-size:12px">⚡ ${formatCurrency(dien)}</div>
                    <div style="font-size:12px; color:var(--text-info)">💧 ${formatCurrency(nuoc)}</div>
                </td>
                <td data-label="Phí khác">${formatCurrency(khac)}</td>
                <td data-label="Tổng tiền"><strong style="color:var(--primary-light)">${formatCurrency(hd.tongTien)}</strong></td>
                <td data-label="Trạng thái">${trangThaiHoaDonBadge(hd.trangThai)}</td>
                <td class="td-actions">
                    <div style="display:flex; gap:4px">
                        <button class="btn btn-ghost btn-sm" onclick="xemChiTietHoaDon(${hd.id})">Chi tiết</button>
                        ${hd.trangThai === 'CHUA_THANH_TOAN' ? 
                            `<button class="btn btn-ghost btn-sm" style="color:var(--success)" onclick="openThanhToan(${hd.id})">Thanh toán</button>
                             <button class="btn btn-ghost btn-sm" onclick="openModalHoaDon(${hd.id})">Sửa</button>` 
                            : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}


let isModeNhanh = false;

async function openModalHoaDon(id = null, nhanh = false) {
    isModeNhanh = nhanh;
    // get active contracts to link right tenants & rooms
    const resHD = await api.get('/hop-dong?trangThai=DANG_HIEU_LUC');
    if (resHD.success) allContracts = resHD.data;

    const title = document.getElementById('modal-hoadon-title');
    const form = document.getElementById('form-hoadon');

    document.getElementById('hd-phong').addEventListener('change', autoDienTienPhong);
    
    if (id) {
        title.textContent = 'Sửa hóa đơn';
        const hd = hoadonList.find(x => x.id === id);
        if(!hd) return;

        const selectPhong = document.getElementById('hd-phong');
        selectPhong.innerHTML = `<option value="${hd.phong.id}" selected>Khu ${hd.phong.khuVuc||'--'} - Phòng ${hd.phong.soPhong}</option>`;

        // Populate select (might include room no longer rented)
        if (!allContracts.find(c => c.phong.id === hd.phong.id)) {
             selectPhong.innerHTML += `<option value="${hd.phong.id}" data-tien="${hd.tienPhong}">Khu ${hd.phong.khuVuc||'--'} - Phòng ${hd.phong.soPhong} (Cũ)</option>`;
        }

        document.getElementById('hd-id').value = hd.id;
        document.getElementById('hd-phong').value = hd.phong.id;
        document.getElementById('hd-phong').disabled = true; // Can't edit room
        document.getElementById('hd-thang').value = hd.thang;
        document.getElementById('hd-thang').disabled = true;
        document.getElementById('hd-nam').value = hd.nam;
        document.getElementById('hd-nam').disabled = true;

        document.getElementById('hd-tu-ngay').value = hd.tuNgay || '';
        document.getElementById('hd-den-ngay').value = hd.denNgay || '';

        document.getElementById('hd-dien-cu').value = hd.chiSoDienCu;
        document.getElementById('hd-dien-moi').value = hd.chiSoDienMoi;
        document.getElementById('hd-gia-dien').value = formatMoney(hd.donGiaDien);

        document.getElementById('hd-nuoc-cu').value = hd.chiSoNuocCu;
        document.getElementById('hd-nuoc-moi').value = hd.chiSoNuocMoi;
        document.getElementById('hd-gia-nuoc').value = formatMoney(hd.donGiaNuoc);

        document.getElementById('hd-tien-phong').value = formatMoney(hd.tienPhong);
        document.getElementById('hd-internet').value = formatMoney(hd.phiInternet);
        document.getElementById('hd-rac').value = formatMoney(hd.phiRac);
        document.getElementById('hd-xe').value = formatMoney(hd.phiGuiXe);
        document.getElementById('hd-phi-khac').value = formatMoney(hd.phiKhac);
        document.getElementById('hd-ghi-chu-phi').value = hd.ghiChuPhiKhac || '';
        document.getElementById('hd-giam-gia').value = hd.giamGia && parseFloat(hd.giamGia) > 0 ? formatMoney(hd.giamGia) : '0';
        document.getElementById('hd-giam-gia-note').value = hd.ghiChuGiamGia || '';
    } else {
        if (isModeNhanh) {
            title.textContent = '⚡ Tạo hóa đơn nhanh';
            document.getElementById('hd-group-phikhac').style.display = 'none';
        } else {
            title.textContent = 'Lập hóa đơn mới';
            document.getElementById('hd-group-phikhac').style.display = 'block';
        }
        form.reset();
        document.getElementById('hd-id').value = '';
        document.getElementById('hd-phong').disabled = false;
        document.getElementById('hd-thang').disabled = false;
        document.getElementById('hd-nam').disabled = false;

        const d = new Date();
        document.getElementById('hd-thang').value = d.getMonth() + 1;
        document.getElementById('hd-nam').value = d.getFullYear();
        document.getElementById('hd-giam-gia').value = '0';
        document.getElementById('hd-giam-gia-note').value = '';
        
        // Defaults prices based on local memory
        document.getElementById('hd-gia-dien').value = formatMoney(cfgGiaDien);
        document.getElementById('hd-gia-nuoc').value = formatMoney(cfgGiaNuoc);

        // Lọc phòng theo kỳ hiện tại (phải await để dropdown có data trước khi pre-select)
        await reloadPhongTheoKy();

        // Điền sẵn ngày nếu có phòng chọn sẵn
        const sel = document.getElementById('hd-phong');
        if (sel.value) {
            const dates = getPeriodDates(sel.value, d.getMonth() + 1, d.getFullYear());
            document.getElementById('hd-tu-ngay').value = dates.start;
            document.getElementById('hd-den-ngay').value = dates.end;
        } else {
            document.getElementById('hd-tu-ngay').value = '';
            document.getElementById('hd-den-ngay').value = '';
        }

        // Khi đổi tháng hoặc năm → reload lại danh sách phòng
        document.getElementById('hd-thang').addEventListener('change', reloadPhongTheoKy);
        document.getElementById('hd-thang').addEventListener('input', reloadPhongTheoKy);
        document.getElementById('hd-nam').addEventListener('change', reloadPhongTheoKy);
        document.getElementById('hd-nam').addEventListener('input', reloadPhongTheoKy);
    }
    
    tinhTongTienTam();
    openModal('modal-hoadon');
}

async function reloadPhongTheoKy() {
    const thang = parseInt(document.getElementById('hd-thang').value);
    const nam = parseInt(document.getElementById('hd-nam').value);
    if (!thang || !nam) return;

    const invoicedPhongIds = new Set(
        hoadonList
            .filter(h => h.thang === thang && h.nam === nam)
            .map(h => h.phong.id)
    );
    const availableContracts = allContracts.filter(c => !invoicedPhongIds.has(c.phong.id));

    const selectPhong = document.getElementById('hd-phong');
    const curVal = selectPhong.value; // giữ lại giá trị đang chọn nếu vẫn còn available
    
    if (isModeNhanh) {
        // Mode nhanh: Load tất cả phòng, không quan tâm hợp đồng
        const resPhong = await api.get('/phong');
        if (resPhong.success) {
            let rooms = resPhong.data;
            // Loại bỏ phòng đã có hóa đơn kỳ này
            rooms = rooms.filter(p => !invoicedPhongIds.has(p.id));
            
            // Sắp xếp khu vực
            rooms.sort((a,b) => (a.khuVuc||'').localeCompare(b.khuVuc||'') || a.soPhong.localeCompare(b.soPhong));
            
            selectPhong.innerHTML = `<option value="">-- Tất cả Phòng (Chưa chốt ${thang}/${nam}) --</option>` + 
                rooms.map(p => {
                    const kv = p.khuVuc ? `Khu ${p.khuVuc} - ` : '';
                    return `<option value="${p.id}" data-tien="${p.giaThue || 0}">⚡ ${kv}Phòng ${p.soPhong}</option>`;
                }).join('');
        }
    } else {
        // Mode thường: Chỉ lấy phòng đang có hợp đồng
        const availableContracts = allContracts.filter(c => !invoicedPhongIds.has(c.phong.id));
        selectPhong.innerHTML = `<option value="">-- Chọn phòng đang thuê --</option>` + 
            availableContracts.map(c => {
                const kv = c.phong.khuVuc ? `Khu ${c.phong.khuVuc} - ` : '';
                const tenants = c.khachThues ? c.khachThues.map(k => k.hoTen).join(', ') : (c.khachThue?.hoTen || '');
                return `<option value="${c.phong.id}" data-tien="${c.giaThueHopDong}" data-khach="${c.khachThues?.[0]?.id || c.khachThue?.id || ''}">${kv}Phòng ${c.phong.soPhong} (${tenants})</option>`;
            }).join('');
    }

    // Restore selection if still available
    if (curVal && selectPhong.querySelector(`option[value="${curVal}"]`)) {
        selectPhong.value = curVal;
    }
}

async function autoDienTienPhong(e) {
    const sel = e.target;
    if (sel.selectedIndex > 0) {
        const option = sel.options[sel.selectedIndex];
        document.getElementById('hd-tien-phong').value = formatMoney(option.dataset.tien || 0);
        
        // Cập nhật kỳ ngày
        const thang = parseNum(document.getElementById('hd-thang').value);
        const nam = parseNum(document.getElementById('hd-nam').value);
        const dates = getPeriodDates(sel.value, thang, nam);
        document.getElementById('hd-tu-ngay').value = dates.start;
        document.getElementById('hd-den-ngay').value = dates.end;
        
        // Fetch chỉ số cũ từ API
        const phongId = sel.value;
        const res = await api.get('/hoa-don/chi-so-cu?phongId=' + phongId);
        if (res.success) {
            document.getElementById('hd-dien-cu').value = res.data.dien;
            document.getElementById('hd-nuoc-cu').value = res.data.nuoc;
        }

        tinhTongTienTam();
        
        // Focus vào nhập số điện mới cho tiện thao tác
        document.getElementById('hd-dien-moi').focus();
    }
}

function tinhTongTienTam() {
    document.getElementById('lbl-gia-dien').textContent = formatCurrency(parseNum(document.getElementById('hd-gia-dien').value)).replace(' đ', '');
    document.getElementById('lbl-gia-nuoc').textContent = formatCurrency(parseNum(document.getElementById('hd-gia-nuoc').value)).replace(' đ', '');

    const dCu = parseNum(document.getElementById('hd-dien-cu').value);
    const dMoi = parseNum(document.getElementById('hd-dien-moi').value);
    const dGia = parseNum(document.getElementById('hd-gia-dien').value);
    const tienDien = Math.max(0, dMoi - dCu) * dGia;

    const nCu = parseNum(document.getElementById('hd-nuoc-cu').value);
    const nMoi = parseNum(document.getElementById('hd-nuoc-moi').value);
    const nGia = parseNum(document.getElementById('hd-gia-nuoc').value);
    const tienNuoc = Math.max(0, nMoi - nCu) * nGia;

    const phong = parseNum(document.getElementById('hd-tien-phong').value);
    const inter = parseNum(document.getElementById('hd-internet').value);
    const rac = parseNum(document.getElementById('hd-rac').value);
    const xe = parseNum(document.getElementById('hd-xe').value);
    const khac = parseNum(document.getElementById('hd-phi-khac').value);
    const giamGia = Math.max(0, parseNum(document.getElementById('hd-giam-gia').value));

    const truocGiam = tienDien + tienNuoc + phong + inter + rac + xe + khac;
    const tong = Math.max(0, truocGiam - giamGia);

    document.getElementById('hd-truoc-giam').textContent = formatCurrency(truocGiam);
    const giamRow = document.getElementById('hd-giam-row');
    if (giamGia > 0) {
        giamRow.style.display = 'flex';
        document.getElementById('hd-giam-lbl').textContent = '- ' + formatCurrency(giamGia);
    } else {
        giamRow.style.display = 'none';
    }
    document.getElementById('hd-tong-tien-tam').textContent = formatCurrency(tong);
}

async function saveHoaDon() {
    const id = document.getElementById('hd-id').value;
    
    const body = {
        chiSoDienCu: parseNum(document.getElementById('hd-dien-cu').value),
        chiSoDienMoi: parseNum(document.getElementById('hd-dien-moi').value),
        donGiaDien: parseNum(document.getElementById('hd-gia-dien').value),
        chiSoNuocCu: parseNum(document.getElementById('hd-nuoc-cu').value),
        chiSoNuocMoi: parseNum(document.getElementById('hd-nuoc-moi').value),
        donGiaNuoc: parseNum(document.getElementById('hd-gia-nuoc').value),
        tienPhong: parseNum(document.getElementById('hd-tien-phong').value),
        phiInternet: parseNum(document.getElementById('hd-internet').value),
        phiRac: parseNum(document.getElementById('hd-rac').value),
        phiGuiXe: parseNum(document.getElementById('hd-xe').value),
        phiKhac: parseNum(document.getElementById('hd-phi-khac').value),
        ghiChuPhiKhac: document.getElementById('hd-ghi-chu-phi').value.trim(),
        giamGia: parseNum(document.getElementById('hd-giam-gia').value),
        ghiChuGiamGia: document.getElementById('hd-giam-gia-note').value.trim(),
        tuNgay: document.getElementById('hd-tu-ngay').value || null,
        denNgay: document.getElementById('hd-den-ngay').value || null
    };

    let res;
    if (id) {
        // Edit 
        res = await api.put(`/hoa-don/${id}`, body);
    } else {
        // Create
        const pId = document.getElementById('hd-phong').value;
        const sel = document.getElementById('hd-phong');
        let kId = null;
        if(sel.selectedIndex > 0 && sel.options[sel.selectedIndex].dataset.khach) {
            kId = sel.options[sel.selectedIndex].dataset.khach;
        }

        body.phong = { id: pId };
        if (kId) body.khachThue = { id: kId };
        body.thang = parseNum(document.getElementById('hd-thang').value);
        body.nam = parseNum(document.getElementById('hd-nam').value);
        body.trangThai = 'CHUA_THANH_TOAN';

        if (!pId) {
            showToast('Vui lòng chọn phòng', 'warning');
            return;
        }
        res = await api.post('/hoa-don', body);
    }

    if (res.success) {
        showToast(res.message, 'success');
        closeModal('modal-hoadon');
        loadDanhSachHoaDon();
    } else {
        showToast(res.message, 'error');
    }
}

function xemChiTietHoaDon(id) {
    const hd = hoadonList.find(x => x.id === id);
    if (!hd) return;

    const tDien = (hd.chiSoDienMoi - hd.chiSoDienCu) * hd.donGiaDien;
    const tNuoc = (hd.chiSoNuocMoi - hd.chiSoNuocCu) * hd.donGiaNuoc;

    const periodLabel  = getPeriodLabel(hd);

    const body = document.getElementById('chitiet-body');
    const footer = document.getElementById('chitiet-footer');

    body.innerHTML = `
        <div style="text-align:center; padding-bottom:16px; border-bottom:1px dashed var(--border)">
            <h1 style="color:var(--success); margin-bottom: 6px; font-size: 26px; text-transform: uppercase;">${cfgTenTro}</h1>
            <h2>Hóa Đơn Tháng ${hd.thang}/${hd.nam}</h2>
            <div id="lbl-ky-tinh-tien-container-${hd.id}">
                ${periodLabel ? `<div style="font-size:13px; color:var(--text-muted); margin-top:5px;">📅 Kỳ tính tiền: <strong id="lbl-ky-tinh-tien-${hd.id}" style="color:var(--primary-light); cursor:pointer; text-decoration:underline;" onclick="openEditKyTinhTien(${hd.id})" title="Nhấn để sửa lại ngày"> ${periodLabel} ✎</strong></div>` : ''}
            </div>
            <div style="font-size:18px; color:var(--text-muted); margin-top:4px;">Phòng ${hd.phong.soPhong}</div>
            <div style="margin-top:10px;">${trangThaiHoaDonBadge(hd.trangThai)}</div>
        </div>

        <div style="padding:20px 0;">
            <div class="hoadon-detail-row">
                <span class="label">Chủ hợp đồng:</span>
                <span class="value">${hd.khachThue ? hd.khachThue.hoTen : '—'}</span>
            </div>
            <div class="hoadon-detail-row">
                <span class="label">Tiền phòng:</span>
                <span class="value">${formatCurrency(hd.tienPhong)}</span>
            </div>
            
            <div class="hoadon-detail-row" style="align-items:start; margin-top:8px;">
                <div style="flex:1;">
                    <div class="label" style="margin-bottom:8px;">Tiền điện (Giá: ${formatCurrency(hd.donGiaDien).replace(' đ', 'đ')}/kWh):</div>
                    <div style="font-size:13px; color:var(--text-muted); display:flex; gap:8px; align-items:center; flex-wrap:wrap">
                        <span style="background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.1); padding:4px 10px; border-radius:6px;">
                            Số mới: <strong style="color:var(--primary-light); font-size:15px">${hd.chiSoDienMoi}</strong>
                        </span>
                        <span>–</span>
                        <span style="background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.1); padding:4px 10px; border-radius:6px;">
                            Số cũ: <strong style="color:var(--text); font-size:15px">${hd.chiSoDienCu}</strong>
                        </span>
                        <span>=</span>
                        <strong style="color:var(--primary-light); font-size:14px; margin-left:4px">${hd.chiSoDienMoi - hd.chiSoDienCu} kWh</strong>
                    </div>
                </div>
                <span class="value" style="padding-top:2px">${formatCurrency(tDien)}</span>
            </div>
            
            <div class="hoadon-detail-row" style="align-items:start; margin-top:16px;">
                <div style="flex:1;">
                    <div class="label" style="margin-bottom:8px;">Tiền nước (Giá: ${formatCurrency(hd.donGiaNuoc).replace(' đ', 'đ')}/m³):</div>
                    <div style="font-size:13px; color:var(--text-muted); display:flex; gap:8px; align-items:center; flex-wrap:wrap">
                        <span style="background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.1); padding:4px 10px; border-radius:6px;">
                            Số mới: <strong style="color:var(--info); font-size:15px">${hd.chiSoNuocMoi}</strong>
                        </span>
                        <span>–</span>
                        <span style="background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.1); padding:4px 10px; border-radius:6px;">
                            Số cũ: <strong style="color:var(--text); font-size:15px">${hd.chiSoNuocCu}</strong>
                        </span>
                        <span>=</span>
                        <strong style="color:var(--info); font-size:14px; margin-left:4px">${hd.chiSoNuocMoi - hd.chiSoNuocCu} m³</strong>
                    </div>
                </div>
                <span class="value" style="padding-top:2px">${formatCurrency(tNuoc)}</span>
            </div>

            ${hd.phiInternet ? `<div class="hoadon-detail-row"><span class="label">Internet:</span><span class="value">${formatCurrency(hd.phiInternet)}</span></div>` : ''}
            ${hd.phiRac ? `<div class="hoadon-detail-row"><span class="label">Rác:</span><span class="value">${formatCurrency(hd.phiRac)}</span></div>` : ''}
            ${hd.phiGuiXe ? `<div class="hoadon-detail-row"><span class="label">Gửi xe:</span><span class="value">${formatCurrency(hd.phiGuiXe)}</span></div>` : ''}
            ${hd.phiKhac ? `<div class="hoadon-detail-row"><span class="label">Phí khác (${hd.ghiChuPhiKhac||''}):</span><span class="value">${formatCurrency(hd.phiKhac)}</span></div>` : ''}

            ${hd.giamGia && parseFloat(hd.giamGia) > 0 ? `
            <div class="hoadon-detail-row" style="margin-top:8px;">
                <span class="label" style="color:var(--warning)">🏷️ Giảm giá${hd.ghiChuGiamGia ? ' (' + hd.ghiChuGiamGia + ')' : ''}:</span>
                <span class="value" style="color:var(--warning)">- ${formatCurrency(hd.giamGia)}</span>
            </div>` : ''}

            <div class="hoadon-detail-row" style="margin-top:10px; border-top:1px dashed var(--border); padding-top:16px;">
                <span class="label" style="font-size:20px; font-weight:800; color:#0f172a !important;">TỔNG CỘNG:</span>
                <span class="value total" style="font-size:24px; font-weight:800; color:#0d9488 !important;">${formatCurrency(hd.tongTien)}</span>
            </div>

            ${hd.ngayThanhToan ? `
            <div class="hoadon-detail-row" style="margin-top:20px; background:var(--bg-input); padding:10px; border-radius:8px;">
                <span class="label">Đã thu ngày:</span>
                <span class="value" style="color:var(--success)">${formatDate(hd.ngayThanhToan)} (${hd.phuongThucThanhToan||''})</span>
            </div>` : ''}
        </div>
    `;

    // Tạo mã QR ngân hàng tự động với API vietqr (hỗ trợ 2 tài khoản)
    const hasQR1 = cfgNganHang && cfgSoTaiKhoan && hd.trangThai === 'CHUA_THANH_TOAN';
    const hasQR2 = cfg2NganHang && cfg2SoTaiKhoan && hd.trangThai === 'CHUA_THANH_TOAN';
    if (hasQR1 || hasQR2) {
        const kv = hd.phong.khuVuc ? hd.phong.khuVuc : '';
        const noiDung = `Tienphong ${kv}${hd.phong.soPhong} Thang${hd.thang}`;
        
        const qrUrl1 = hasQR1 ? `https://img.vietqr.io/image/${cfgNganHang}-${cfgSoTaiKhoan}-compact2.png?amount=${hd.tongTien}&addInfo=${encodeURIComponent(noiDung)}&accountName=${encodeURIComponent(cfgTenChuTaiKhoan)}` : '';
        const qrUrl2 = hasQR2 ? `https://img.vietqr.io/image/${cfg2NganHang}-${cfg2SoTaiKhoan}-compact2.png?amount=${hd.tongTien}&addInfo=${encodeURIComponent(noiDung)}&accountName=${encodeURIComponent(cfg2TenChuTaiKhoan)}` : '';

        // Add a radio group to select QR if both are present
        let qrSelectionHtml = '';
        if (hasQR1 && hasQR2) {
            qrSelectionHtml = `
            <div style="display:flex; justify-content:center; gap:16px; margin-bottom:12px;">
                <label style="cursor:pointer; display:flex; align-items:center; gap:6px; font-size:14px; padding:6px 12px; background:rgba(255,255,255,0.05); border-radius:8px; border:1px solid var(--border);">
                    <input type="radio" name="qr_select" value="qr1" checked onchange="toggleQRDisplay()">
                    <strong>${cfgNganHang}</strong>
                </label>
                <label style="cursor:pointer; display:flex; align-items:center; gap:6px; font-size:14px; padding:6px 12px; background:rgba(255,255,255,0.05); border-radius:8px; border:1px solid var(--border);">
                    <input type="radio" name="qr_select" value="qr2" onchange="toggleQRDisplay()">
                    <strong>${cfg2NganHang}</strong>
                </label>
            </div>
            `;
        }

        body.innerHTML += `
        <div style="margin-top:20px; background:var(--bg-card); padding:20px; border-radius:12px; border:1px solid var(--border);">
            <div style="color:var(--text-muted); font-size:14px; margin-bottom:14px; text-align:center;">📲 Chọn tài khoản nhận tiền</div>
            ${qrSelectionHtml}
            
            <div id="qr-container-1" style="display:${hasQR1 ? 'block' : 'none'}; text-align:center;">
                <div style="font-size:12px; color:var(--text-muted); margin-bottom:6px;">🏦 ${cfgNganHang} · ${cfgSoTaiKhoan}</div>
                <img src="${qrUrl1}" alt="QR TK1" style="max-width:200px; width:100%; border-radius:10px; background:white; padding:8px; box-shadow:0 4px 12px rgba(0,0,0,0.3);">
                <div style="font-size:12px; font-weight:600; color:var(--text); margin-top:6px;">${cfgTenChuTaiKhoan}</div>
            </div>
            
            <div id="qr-container-2" style="display:${!hasQR1 && hasQR2 ? 'block' : 'none'}; text-align:center;">
                <div style="font-size:12px; color:var(--text-muted); margin-bottom:6px;">🏦 ${cfg2NganHang} · ${cfg2SoTaiKhoan}</div>
                <img src="${qrUrl2}" alt="QR TK2" style="max-width:200px; width:100%; border-radius:10px; background:white; padding:8px; box-shadow:0 4px 12px rgba(0,0,0,0.3);">
                <div style="font-size:12px; font-weight:600; color:var(--text); margin-top:6px;">${cfg2TenChuTaiKhoan}</div>
            </div>
        </div>`;
    }

    footer.innerHTML = `
        <button class="btn btn-ghost" onclick="copyInvoiceImage()" style="border: 1px solid var(--border); margin-right:auto;">📸 Copy Ảnh</button>
        <button class="btn btn-ghost" onclick="closeModal('modal-chitiet')">Đóng</button>
        ${hd.trangThai === 'CHUA_THANH_TOAN' ? 
            `<button class="btn btn-success" onclick="openThanhToan(${hd.id})">Thanh toán ngay</button>` : 
            `<button class="btn btn-ghost" style="color:var(--danger)" onclick="deleteHoaDon(${hd.id})">Thu hồi & Xóa</button>`
        }
    `;

    openModal('modal-chitiet');
}

// Hàm switch QR trong popup
function toggleQRDisplay() {
    const isQr1 = document.querySelector('input[name="qr_select"][value="qr1"]').checked;
    document.getElementById('qr-container-1').style.display = isQr1 ? 'block' : 'none';
    document.getElementById('qr-container-2').style.display = isQr1 ? 'none' : 'block';
}

window.openEditKyTinhTien = function(id) {
    const hd = hoadonList.find(x => x.id === id);
    if (!hd) return;
    
    const container = document.getElementById(`lbl-ky-tinh-tien-container-${id}`);
    const tuNgayVal = parseDateToString(hd.tuNgay);
    const denNgayVal = parseDateToString(hd.denNgay);
    
    container.innerHTML = `
        <div style="display:inline-flex; align-items:center; gap:5px; justify-content:center; width:100%; margin-top:5px;">
            <span style="font-size:12px; color:var(--text-muted);">📅 Từ</span>
            <input type="date" id="edit-tu-ngay-${id}" class="form-control" style="width:115px; font-size:12px; padding:2px 4px; text-align:center; height:26px;" value="${tuNgayVal}">
            <span style="color:var(--text-muted)">đến</span>
            <input type="date" id="edit-den-ngay-${id}" class="form-control" style="width:115px; font-size:12px; padding:2px 4px; text-align:center; height:26px;" value="${denNgayVal}">
            <button class="btn btn-success btn-sm" style="padding:2px 6px; font-size:11px; height:26px;" onclick="saveKyTinhTien(${id}, event)">Lưu</button>
            <button class="btn btn-ghost btn-sm" style="padding:2px 6px; font-size:11px; height:26px;" onclick="cancelEditKyTinhTien(${id}, event)">Hủy</button>
        </div>
    `;
}

window.cancelEditKyTinhTien = function(id, e) {
    if (e) e.stopPropagation();
    xemChiTietHoaDon(id); 
}

window.saveKyTinhTien = async function(id, e) {
    if (e) e.stopPropagation();
    const tuNgay = document.getElementById(`edit-tu-ngay-${id}`).value;
    const denNgay = document.getElementById(`edit-den-ngay-${id}`).value;
    
    if (!tuNgay || !denNgay) {
        showToast('Vui lòng chọn cả từ ngày và đến ngày!', 'warning');
        return;
    }
    
    const btn = e.target;
    const origText = btn.innerHTML;
    btn.innerHTML = '...';
    btn.disabled = true;

    const res = await api.put(`/hoa-don/${id}/ky-tinh-tien`, { tuNgay: tuNgay, denNgay: denNgay });
    if (res.success) {
        showToast('Đã sửa kỳ tính tiền!', 'success');
        const hd = hoadonList.find(x => x.id === id);
        if (hd) {
            // Spring return có thể là mảng date [YYYY, MM, DD] hoặc string
            hd.tuNgay = res.data.tuNgay;
            hd.denNgay = res.data.denNgay;
        }
        xemChiTietHoaDon(id);
    } else {
        showToast(res.message, 'error');
        btn.innerHTML = origText;
        btn.disabled = false;
    }
}

function openThanhToan(id) {
    if (confirm('Xác nhận khách đã thanh toán tiền phòng?')) {
        xacNhanThanhToan(id, 'Tiền mặt/Chuyển khoản');
    }
}

async function xacNhanThanhToan(id, pt) {
    const res = await api.put(`/hoa-don/${id}/thanh-toan`, { phuongThuc: pt });
    if (res.success) {
        showToast('Đã xác nhận thanh toán!', 'success');
        closeModal('modal-chitiet');
        loadDanhSachHoaDon();
    } else {
        showToast(res.message, 'error');
    }
}

function deleteHoaDon(id) {
    confirmAction('Bạn có chắc muốn xóa hóa đơn này không?', async () => {
        const res = await api.delete(`/hoa-don/${id}`);
        if (res.success) {
            showToast(res.message, 'success');
            closeModal('modal-chitiet');
            loadDanhSachHoaDon();
        } else {
            showToast(res.message, 'error');
        }
    });
}

async function copyInvoiceImage() {
    try {
        const captureArea = document.getElementById('chitiet-body');
        
        showToast('Đang tạo ảnh hóa đơn...', 'info');
        
        const canvas = await html2canvas(captureArea, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true
        });
        
        canvas.toBlob(async function(blob) {
            try {
                const item = new ClipboardItem({ "image/png": blob });
                await navigator.clipboard.write([item]);
                showToast('Đã copy Hóa Đơn vào Bộ Nhớ! (Nhấn Ctrl+V để dán)', 'success');
            } catch (err) {
                console.error(err);
                showToast('Trình duyệt chưa cho phép copy. Hãy dùng tính năng chụp màn hình nhé!', 'warning');
            }
        });
    } catch (e) {
        console.error(e);
        showToast('Lỗi khi tạo ảnh hóa đơn', 'error');
    }
}

// Init
(async function initApp() {
    await loadConfig();
    initFilters();
    // Load song song hóa đơn + hợp đồng (để tra kỳ tính tiền)
    await Promise.all([loadDanhSachHoaDon(), loadAllContracts()]);
})();

// Khởi tạo format tiền cho các ô nhập — có autoScale (nhập 2500 → 2,500,000)
['hd-tien-phong', 'hd-internet', 'hd-rac', 'hd-xe', 'hd-phi-khac'].forEach(id => {
    applyMoneyInput(document.getElementById(id), {
        autoScale: true,
        onUpdate: () => { if (typeof tinhTongTienTam === 'function') tinhTongTienTam(); }
    });
});
// Giảm giá: không autoScale, nhưng vẫn format
applyMoneyInput(document.getElementById('hd-giam-gia'), {
    autoScale: false,
    onUpdate: () => { if (typeof tinhTongTienTam === 'function') tinhTongTienTam(); }
});
// Đơn giá điện/nước: không autoScale
applyMoneyInput(document.getElementById('hd-gia-dien'), {
    autoScale: false,
    onUpdate: () => { if (typeof tinhTongTienTam === 'function') tinhTongTienTam(); }
});
applyMoneyInput(document.getElementById('hd-gia-nuoc'), {
    autoScale: false,
    onUpdate: () => { if (typeof tinhTongTienTam === 'function') tinhTongTienTam(); }
});

// Auto open modal if navigated from Cho Chot Hoa Don
setTimeout(async () => {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get('viewHoaDon')) {
        // ── Xem chi tiết hoá đơn (từ nút "Xem chi tiết HĐ" bên cho-chot) ──
        const hoaDonId = parseInt(urlParams.get('viewHoaDon'));

        // Chờ hoadonList được load xong (tối đa ~2 giây)
        let tries = 0;
        while (hoadonList.length === 0 && tries < 10) {
            await new Promise(r => setTimeout(r, 200));
            tries++;
        }
        xemChiTietHoaDon(hoaDonId);
        window.history.replaceState({}, document.title, 'hoa-don.html');

    } else if (urlParams.get('action') === 'new') {
        // ── Tạo hoá đơn mới (từ nút "Lập hóa đơn ngay" bên cho-chot) ──
        await openModalHoaDon(null);

        // Override kỳ tháng/năm nếu được truyền từ cho-chot
        const thangParam = urlParams.get('thang');
        const namParam   = urlParams.get('nam');
        if (thangParam) document.getElementById('hd-thang').value = thangParam;
        if (namParam)   document.getElementById('hd-nam').value   = namParam;

        // Reload danh sách phòng theo kỳ mới
        if (thangParam || namParam) {
            await reloadPhongTheoKy();
        }

        // Pre-select đúng phòng được click từ cho-chot
        const pId = urlParams.get('phongId');
        if (pId) {
            const pSelect = document.getElementById('hd-phong');
            pSelect.value = pId;
            pSelect.dispatchEvent(new Event('change')); // tự điền tiền phòng + chỉ số cũ
        }

        window.history.replaceState({}, document.title, 'hoa-don.html');
    }
}, 300);

