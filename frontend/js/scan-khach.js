let pendingKhach = [];
let pendingPhong = [];

function parseDate(raw) {
    if (!raw) return null;
    // Normalize: replace any dash, dot, or full-width slash with normal slash
    raw = raw.replace(/[.\-－／]/g, '/').trim();
    const dParts = raw.split('/');
    if (dParts.length === 3) {
        const [d, m, y] = dParts.map(x => x.trim());
        if (d && m && y) {
            return `${y.padStart(4,'0')}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
        }
    }
    return null;
}

function parseText() {
    const text = document.getElementById('scan-text').value;
    const lines = text.split('\n');
    pendingKhach = [];
    
    lines.forEach(line => {
        if (!line.trim()) return;
        // split by comma, preserve empty fields (for ,, pattern)
        const parts = line.split(',').map(p => p.trim());
        if (!parts[0]) return;

        const hoTen       = parts[0] || '';
        const cccd        = parts[1] || '';
        const sdt         = parts[2] || '';          // empty string if ,,
        const rawNgaySinh = parts[3] || '';
        const rawGioiTinh = (parts[4] || '').toLowerCase();
        const diaChi      = parts[5] || '';

        const ngaySinh = parseDate(rawNgaySinh);

        let gioiTinh = 'KHAC';
        if (rawGioiTinh.includes('nam')) gioiTinh = 'NAM';
        else if (rawGioiTinh.includes('n\u1eef') || rawGioiTinh.includes('nu')) gioiTinh = 'NU';

        pendingKhach.push({
            hoTen, cccd, soDienThoai: sdt, ngaySinh, gioiTinh, diaChi,
            status: 'pending', errorMsg: ''
        });
    });

    if (pendingKhach.length === 0) {
        showToast('Không tìm thấy dữ liệu hợp lệ nào!', 'error');
    } else {
        showToast(`Đã tìm thấy ${pendingKhach.length} dòng dữ liệu hợp lệ!`, 'info');
    }

    renderPreview();
}

function renderPreview() {
    const tbody = document.getElementById('preview-tbody');
    const btnSave = document.getElementById('btn-save-all');
    
    if (!pendingKhach.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:var(--text-muted)">Chưa có dữ liệu</td></tr>`;
        btnSave.style.display = 'none';
        return;
    }

    tbody.innerHTML = pendingKhach.map((k, idx) => {
        let statusBadge = '';
        if (k.status === 'success') statusBadge = '<span style="color:var(--success); font-weight:600">✅ Xong</span>';
        else if (k.status === 'error') statusBadge = `<span style="color:var(--danger); cursor:pointer" title="${k.errorMsg}">❌ Lỗi</span>`;
        else statusBadge = '<span style="color:var(--warning)">⏳ Chờ xử lý</span>';

        return `
            <tr>
                <td style="font-weight:600">${k.hoTen}</td>
                <td><span class="badge badge-gray">${k.cccd || '—'}</span></td>
                <td>📱 ${k.soDienThoai || '—'}</td>
                <td>${k.ngaySinh ? k.ngaySinh.split('-').reverse().join('/') : '—'}</td>
                <td>${k.gioiTinh === 'NAM' ? '♂ Nam' : (k.gioiTinh === 'NU' ? '♀ Nữ' : 'Khác')}</td>
                <td>${k.diaChi || '—'}</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    }).join('');
    
    // Only show save button if there are pending items
    if (pendingKhach.some(k => k.status !== 'success')) {
        btnSave.style.display = 'inline-block';
    } else {
        btnSave.style.display = 'none';
    }
}

async function saveAll() {
    let successCount = 0;
    document.getElementById('btn-save-all').disabled = true;
    document.getElementById('btn-save-all').textContent = "⏳ Đang chạy...";

    for (let i = 0; i < pendingKhach.length; i++) {
        const k = pendingKhach[i];
        if (k.status === 'success') continue; 

        // Map to API object — gửi null nếu trường trống để tránh lỗi unique constraint DB
        const body = {
            hoTen: k.hoTen,
            cccd: k.cccd && k.cccd.trim() ? k.cccd.trim() : null,
            soDienThoai: k.soDienThoai && k.soDienThoai.trim() ? k.soDienThoai.trim() : null,
            ngaySinh: k.ngaySinh || null,
            gioiTinh: k.gioiTinh,
            diaChi: k.diaChi && k.diaChi.trim() ? k.diaChi.trim() : null
        };

        const res = await api.post('/khach-thue', body);
        if (res.success) {
            k.status = 'success';
            successCount++;
        } else {
            k.status = 'error';
            k.errorMsg = res.message || 'Lỗi hệ thống';
        }
        
        // Cập nhật giao diện sau mỗi người để hiệu ứng chạy từng hàng rõ ràng
        renderPreview();
    }
    
    document.getElementById('btn-save-all').disabled = false;
    document.getElementById('btn-save-all').textContent = "🔥 Lưu Hàng Loạt Vào Hệ Thống";

    const totalToSave = pendingKhach.filter(k => k.status === 'success' || k.status === 'error').length;
    if (successCount === totalToSave && totalToSave > 0) {
        showToast('Đã lưu thành công tất cả vào hệ thống!', 'success');
    } else {
        showToast(`Hoàn tất: Lỗi ${totalToSave - successCount} trường hợp do trùng lặp hoặc thiếu thông tin!`, 'warning');
    }
}

// ───────────────────────────────────────
// TẠO PHÒNG HÀNG LOẠT
// ───────────────────────────────────────

/**
 * Phân tích cú pháp dãy phòng:
 *  A01-A10       -> Khu A, phòng 01..10, bước 1 (tất cả)
 *  C02--C10      -> Khu C, phòng 02..10, bước 2 (chỉ số chẵn)
 *  P12-24        -> Khu P, phòng 12..24 (end không cần prefix)
 *  A01-A10, B01-B05 -> nhiều nhóm cùng lúc
 */
function parsePhongRange() {
    const raw = document.getElementById('phong-range').value.trim();
    const giaThue = parseNum(document.getElementById('phong-gia').value) || 0;
    const dienTich = parseFloat(document.getElementById('phong-dientich').value) || null;
    const moTa = document.getElementById('phong-mota').value.trim();

    if (!raw) { showToast('Vui lòng nhập dãy phòng!', 'warning'); return; }
    if (!giaThue) { showToast('Vui lòng nhập giá thuê!', 'warning'); return; }

    pendingPhong = [];

    // Tách các nhóm theo dấu phẩy (nhưng bảo vệ "--")
    const groups = raw.split(',').map(s => s.trim()).filter(Boolean);

    for (const group of groups) {
        // Phát hiện double-dash trước (chỉ số chẵn)
        const isEvenStep = group.includes('--');
        const step = isEvenStep ? 2 : 1;

        // Normalize: thay "--" thành "-" để parse
        const normalized = group.replace('--', '-');

        // Regex: (tiền tố chữ)(số đầu)-(tiền tố chữ tùy chọn)(số cuối)
        const match = normalized.match(/^([A-Za-z]*)(\d+)-([A-Za-z]*)(\d+)$/);
        if (!match) {
            showToast(`Không hiểu cú pháp: "${group}"`, 'error');
            continue;
        }

        const khuVucStart = match[1].toUpperCase();
        const numStart    = parseInt(match[2]);
        const khuVucEnd   = match[3].toUpperCase() || khuVucStart; // nếu không có prefix ở cuối thì dùng cùng khu
        const numEnd      = parseInt(match[4]);
        const padLen      = match[2].length; // giữ độ dài số (ví dụ "01" = 2 chữ số)

        if (numStart > numEnd) {
            showToast(`Số đầu phải nhỏ hơn số cuối: "${group}"`, 'warning');
            continue;
        }

        // Với chỉ số chẵn (double-dash): bắt đầu từ số chẵn đầu tiên >= numStart
        let start = numStart;
        if (isEvenStep && start % 2 !== 0) start++; // bù lên số chẵn gần nhất

        for (let n = start; n <= numEnd; n += step) {
            const soPhong = String(n).padStart(padLen, '0');
            // Xác định khu vực: nếu 2 đầu cùng khu thì dùng đó, còn nếu khác nhau (hiếm) dùng đầu
            const khuVuc = khuVucStart || khuVucEnd;
            pendingPhong.push({ khuVuc, soPhong, giaThue, dienTich, moTa, status: 'pending', errorMsg: '' });
        }
    }

    if (!pendingPhong.length) {
        showToast('Không tạo được phòng nào từ cú pháp đã nhập!', 'error');
    } else {
        showToast(`Chuẩn bị tạo ${pendingPhong.length} phòng!`, 'info');
    }
    renderPhongPreview();
}

function renderPhongPreview() {
    const tbody = document.getElementById('phong-preview-tbody');
    const btnSave = document.getElementById('btn-save-phong');

    if (!pendingPhong.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--text-muted)">Chưa có dữ liệu phòng</td></tr>`;
        btnSave.style.display = 'none';
        return;
    }

    tbody.innerHTML = pendingPhong.map(p => {
        let badge = '';
        if (p.status === 'success') badge = '<span style="color:var(--success); font-weight:600">✅ Xong</span>';
        else if (p.status === 'error') badge = `<span style="color:var(--danger)" title="${p.errorMsg}">❌ Lỗi</span>`;
        else badge = '<span style="color:var(--warning)">⏳ Chờ</span>';

        const giaFormatted = new Intl.NumberFormat('vi-VN').format(p.giaThue) + ' đ';
        return `
            <tr>
                <td><span style="background:rgba(99,102,241,0.15); color:var(--primary-light); padding:2px 10px; border-radius:6px; font-weight:600">Khu ${p.khuVuc || '—'}</span></td>
                <td><strong>Phòng ${p.soPhong}</strong></td>
                <td style="color:var(--primary-light)">${giaFormatted}/th</td>
                <td>${p.dienTich ? p.dienTich + ' m²' : '—'}</td>
                <td>${badge}</td>
            </tr>`;
    }).join('');

    if (pendingPhong.some(p => p.status !== 'success')) {
        btnSave.style.display = 'inline-block';
    } else {
        btnSave.style.display = 'none';
    }
}

async function saveAllPhong() {
    let successCount = 0;
    const btn = document.getElementById('btn-save-phong');
    btn.disabled = true;
    btn.textContent = '⏳ Đang tạo...';

    for (let i = 0; i < pendingPhong.length; i++) {
        const p = pendingPhong[i];
        if (p.status === 'success') continue;

        const body = {
            soPhong: p.soPhong,
            khuVuc: p.khuVuc || null,
            giaThue: p.giaThue,
            dienTich: p.dienTich,
            moTa: p.moTa || '',
            trangThai: 'TRONG'
        };

        const res = await api.post('/phong', body);
        if (res.success) {
            p.status = 'success';
            successCount++;
        } else {
            p.status = 'error';
            p.errorMsg = res.message || 'Lỗi';
        }
        renderPhongPreview();
    }

    btn.disabled = false;
    btn.textContent = '🔥 Tạo Phòng Hàng Loạt';

    const total = pendingPhong.length;
    if (successCount === total) {
        showToast(`✅ Đã tạo thành công ${successCount} phòng!`, 'success');
    } else {
        showToast(`Hoàn tất: ${successCount}/${total} phòng tạo thành công. ${total - successCount} lỗi (trùng hoặc thiếu thông tin).`, 'warning');
    }
}
