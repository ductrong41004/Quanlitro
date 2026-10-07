let khachList = [];
let activeContracts = [];

async function loadDanhSachKhach() {
    const search = document.getElementById('search-khach').value;
    let url = '/khach-thue';
    if (search) url += `?search=${encodeURIComponent(search)}`;

    const [resKhach, resHD] = await Promise.all([
        api.get(url),
        api.get('/hop-dong?trangThai=DANG_HIEU_LUC')
    ]);
    const tbody = document.getElementById('khach-tbody');
    
    if (!resKhach.success) {
        showToast(resKhach.message, 'error');
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">${resKhach.message}</td></tr>`;
        return;
    }

    khachList = resKhach.data;
    if (resHD.success) activeContracts = resHD.data;
    if (!khachList.length) {
        tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">👥</div><h3>Không có dữ liệu</h3></div></td></tr>`;
        return;
    }

    const tenantRoomMap = {};
    activeContracts.forEach(hd => {
        const roomName = (hd.phong.soPhong || '') + (hd.phong.khuVuc ? ` Khu Vực ${hd.phong.khuVuc}` : '');
        hd.khachThues.forEach(k => {
            tenantRoomMap[k.id] = roomName;
        });
    });

    tbody.innerHTML = khachList.map(k => {
        const phongHienTai = tenantRoomMap[k.id] 
            ? `<span style="color:var(--success); font-weight:600">${tenantRoomMap[k.id]}</span>` 
            : `<span style="color:var(--text-muted); font-size:12px;">Chưa có phòng</span>`;
            
        return `
        <tr>
            <td>
                <div style="font-weight:600; color:var(--text-primary)">${k.hoTen}</div>
            </td>
            <td>${phongHienTai}</td>
            <td>
                <div>📱 ${k.soDienThoai || '—'}</div>
 
            </td>
            <td><span class="badge badge-gray">${k.cccd || '—'}</span></td>
            <td>${formatDate(k.ngaySinh)}</td>
            <td>${gioiTinhLabel(k.gioiTinh)}</td>
            <td>
                <button class="btn btn-ghost btn-sm" onclick="openModalKhach(${k.id})">Sửa</button>
                <button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="deleteKhach(${k.id})">Xóa</button>
            </td>
        </tr>
        `;
    }).join('');
}

function openModalKhach(id = null) {
    const title = document.getElementById('modal-khach-title');
    const form = document.getElementById('form-khach');

    if (id) {
        title.textContent = 'Sửa thông tin khách thuê';
        const k = khachList.find(x => x.id === id);
        if(!k) return;
        document.getElementById('k-id').value = k.id;
        document.getElementById('k-ho-ten').value = k.hoTen;
        document.getElementById('k-cccd').value = k.cccd || '';
        document.getElementById('k-sdt').value = k.soDienThoai || '';
 
        document.getElementById('k-dia-chi').value = k.diaChi || '';
        document.getElementById('k-ngay-sinh').value = k.ngaySinh || '';
        document.getElementById('k-gioi-tinh').value = k.gioiTinh;
        document.getElementById('k-ghi-chu').value = k.ghiChu || '';
    } else {
        title.textContent = 'Thêm khách thuê mới';
        form.reset();
        document.getElementById('k-id').value = '';
        document.getElementById('k-gioi-tinh').value = 'KHAC';
    }
    openModal('modal-khach');
}

async function saveKhach() {
    const id = document.getElementById('k-id').value;
    const body = {
        hoTen: document.getElementById('k-ho-ten').value.trim(),
        cccd: document.getElementById('k-cccd').value.trim(),
        soDienThoai: document.getElementById('k-sdt').value.trim(),
        diaChi: document.getElementById('k-dia-chi').value.trim(),
        ngaySinh: document.getElementById('k-ngay-sinh').value || null,
        gioiTinh: document.getElementById('k-gioi-tinh').value,
        ghiChu: document.getElementById('k-ghi-chu').value.trim()
    };

    if (!body.hoTen) {
        showToast('Vui lòng nhập họ tên', 'warning');
        return;
    }

    let res;
    if (id) {
        res = await api.put(`/khach-thue/${id}`, body);
    } else {
        res = await api.post('/khach-thue', body);
    }

    if (res.success) {
        showToast(res.message, 'success');
        closeModal('modal-khach');
        loadDanhSachKhach();
    } else {
        showToast(res.message, 'error');
    }
}

function deleteKhach(id) {
    confirmAction('Bạn có chắc muốn xóa khách thuê này không? Cần đảm bảo khách không còn hợp đồng hay hóa đơn nào.', async () => {
        const res = await api.delete(`/khach-thue/${id}`);
        if (res.success) {
            showToast(res.message, 'success');
            loadDanhSachKhach();
        } else {
            showToast(res.message, 'error');
        }
    });
}

// Init
loadDanhSachKhach();
