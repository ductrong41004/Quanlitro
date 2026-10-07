// ==============================================================================
// FIREBASE FIRESTORE ADAPTER CHO QUẢN LÝ PHÒNG TRỌ
// Thay thế toàn bộ Backend Java Spring Boot & MySQL -> Chạy 100% trên GitHub Pages & Firebase
// ==============================================================================

const firebaseConfig = {
  apiKey: "AIzaSyB76SscNrtakRJXfTrWn-ABGuMJSNdGhmc",
  authDomain: "quan-ly-phong-tro-ec03c.firebaseapp.com",
  projectId: "quan-ly-phong-tro-ec03c",
  storageBucket: "quan-ly-phong-tro-ec03c.firebasestorage.app",
  messagingSenderId: "924103181038",
  appId: "1:924103181038:web:c296da250244e597cf69ff",
  measurementId: "G-WEK2400NCG"
};

let db = null;
let firebaseReadyPromise = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function initFirebase() {
  if (db) return db;
  if (!window.firebase) {
    await loadScript('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
    await loadScript('https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore-compat.js');
  }
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  db = firebase.firestore();
  try {
    await db.enablePersistence({ synchronizeTabs: true });
  } catch (e) {
    // Persistence might fail in some multi-tab or incognito scenarios, ignore
  }
  return db;
}

function ensureDB() {
  if (!firebaseReadyPromise) {
    firebaseReadyPromise = initFirebase();
  }
  return firebaseReadyPromise;
}

// Khởi tạo ngay khi tải script
ensureDB().catch(console.error);

// Helper lấy document snapshot thành object có id số
function docToData(doc) {
  if (!doc.exists) return null;
  const d = doc.data();
  const numId = parseInt(doc.id);
  d.id = isNaN(numId) ? doc.id : numId;
  return d;
}

// ==============================================================================
// CORE API ROUTER (Thay thế REST API Spring Boot)
// ==============================================================================

const api = {
  get: async (endpoint) => {
    const firestore = await ensureDB();
    const [path, queryString] = endpoint.split('?');
    const params = new URLSearchParams(queryString || '');

    try {
      // 1. CẤU HÌNH: /cau-hinh
      if (path === '/cau-hinh') {
        const snap = await firestore.collection('cau_hinh').doc('main').get();
        return { success: true, data: snap.exists ? snap.data() : {} };
      }

      // 2. PHÒNG: /phong
      if (path === '/phong') {
        const snap = await firestore.collection('phong').get();
        let list = snap.docs.map(docToData);
        const tt = params.get('trangThai');
        if (tt) list = list.filter(p => p.trangThai === tt);
        list.sort((a, b) => (String(a.soPhong)).localeCompare(String(b.soPhong), undefined, { numeric: true }));
        return { success: true, data: list };
      }

      if (path.startsWith('/phong/')) {
        const id = path.split('/')[2];
        const doc = await firestore.collection('phong').doc(String(id)).get();
        if (!doc.exists) return { success: false, message: 'Không tìm thấy phòng!' };
        return { success: true, data: docToData(doc) };
      }

      // 3. KHÁCH THUÊ: /khach-thue
      if (path === '/khach-thue') {
        const snap = await firestore.collection('khach_thue').get();
        let list = snap.docs.map(docToData);
        const kw = params.get('hoTen');
        if (kw) {
          const lower = kw.toLowerCase();
          list = list.filter(k => k.hoTen && k.hoTen.toLowerCase().includes(lower));
        }
        list.sort((a, b) => (a.hoTen || '').localeCompare(b.hoTen || ''));
        return { success: true, data: list };
      }

      if (path.startsWith('/khach-thue/')) {
        const id = path.split('/')[2];
        const doc = await firestore.collection('khach_thue').doc(String(id)).get();
        if (!doc.exists) return { success: false, message: 'Không tìm thấy khách thuê!' };
        return { success: true, data: docToData(doc) };
      }

      // 4. HỢP ĐỒNG: /hop-dong
      if (path === '/hop-dong') {
        const snap = await firestore.collection('hop_dong').get();
        let list = snap.docs.map(docToData);
        const tt = params.get('trangThai');
        if (tt) list = list.filter(h => h.trangThai === tt);
        const phongId = params.get('phongId');
        if (phongId) list = list.filter(h => h.phong && String(h.phong.id) === String(phongId));
        list.sort((a, b) => (b.id || 0) - (a.id || 0));
        return { success: true, data: list };
      }

      if (path.startsWith('/hop-dong/')) {
        const id = path.split('/')[2];
        const doc = await firestore.collection('hop_dong').doc(String(id)).get();
        if (!doc.exists) return { success: false, message: 'Không tìm thấy hợp đồng!' };
        return { success: true, data: docToData(doc) };
      }

      // 5. HÓA ĐƠN: /hoa-don
      if (path === '/hoa-don/chi-so-cu') {
        const pId = params.get('phongId');
        if (!pId) return { success: false, message: 'Thiếu phongId' };

        // 1. Tìm hoá đơn gần nhất của phòng
        const hdSnap = await firestore.collection('hoa_don').get();
        const invoices = hdSnap.docs.map(docToData).filter(h => h.phong && String(h.phong.id) === String(pId));
        if (invoices.length > 0) {
          invoices.sort((a, b) => (b.nam - a.nam) || (b.thang - a.thang) || (b.id - a.id));
          const latest = invoices[0];
          return { success: true, data: { dien: latest.chiSoDienMoi || 0, nuoc: latest.chiSoNuocMoi || 0 } };
        }

        // 2. Tìm từ hợp đồng đang hiệu lực
        const cSnap = await firestore.collection('hop_dong').get();
        const contracts = cSnap.docs.map(docToData).filter(c => c.trangThai === 'DANG_HIEU_LUC' && c.phong && String(c.phong.id) === String(pId));
        if (contracts.length > 0) {
          const c = contracts[0];
          return { success: true, data: { dien: c.chiSoDienBanDau || 0, nuoc: c.chiSoNuocBanDau || 0 } };
        }

        // 3. Đọc từ phòng
        const pDoc = await firestore.collection('phong').doc(String(pId)).get();
        if (pDoc.exists) {
          const p = pDoc.data();
          return { success: true, data: { dien: p.chiSoDien || 0, nuoc: p.chiSoNuoc || 0 } };
        }

        return { success: true, data: { dien: 0, nuoc: 0 } };
      }

      if (path === '/hoa-don') {
        const snap = await firestore.collection('hoa_don').get();
        let list = snap.docs.map(docToData);
        const thang = params.get('thang');
        const nam = params.get('nam');
        const phongId = params.get('phongId');
        const tt = params.get('trangThai');
        if (thang) list = list.filter(h => String(h.thang) === String(thang));
        if (nam) list = list.filter(h => String(h.nam) === String(nam));
        if (phongId) list = list.filter(h => h.phong && String(h.phong.id) === String(phongId));
        if (tt) list = list.filter(h => h.trangThai === tt);
        list.sort((a, b) => (b.nam - a.nam) || (b.thang - a.thang) || (b.id - a.id));
        return { success: true, data: list };
      }

      if (path.startsWith('/hoa-don/')) {
        const id = path.split('/')[2];
        const doc = await firestore.collection('hoa_don').doc(String(id)).get();
        if (!doc.exists) return { success: false, message: 'Không tìm thấy hóa đơn!' };
        return { success: true, data: docToData(doc) };
      }

      // 6. DASHBOARD: /dashboard
      if (path === '/dashboard') {
        const now = new Date();
        const curMonth = now.getMonth() + 1;
        const curYear = now.getFullYear();

        const [pSnap, kSnap, hdSnap, invSnap] = await Promise.all([
          firestore.collection('phong').get(),
          firestore.collection('khach_thue').get(),
          firestore.collection('hop_dong').get(),
          firestore.collection('hoa_don').get()
        ]);

        const rooms = pSnap.docs.map(docToData);
        const tenants = kSnap.docs.map(docToData);
        const contracts = hdSnap.docs.map(docToData);
        const invoices = invSnap.docs.map(docToData);

        const tongSoPhong = rooms.length;
        const soPhongTrong = rooms.filter(r => r.trangThai === 'TRONG').length;
        const soPhongDaThue = rooms.filter(r => r.trangThai === 'DA_THUE').length;
        const soPhongDangSua = rooms.filter(r => r.trangThai === 'DANG_SUA').length;
        const tongKhachThue = tenants.length;

        const soHoaDonChuaThanhToan = invoices.filter(i => i.trangThai === 'CHUA_THANH_TOAN').length;

        // Doanh thu tháng và năm (chỉ tính DA_THANH_TOAN)
        let doanhThuThang = 0;
        let doanhThuNam = 0;
        const bieuDo = Array.from({ length: 12 }, (_, i) => ({ thang: i + 1, doanhThu: 0 }));

        invoices.forEach(inv => {
          if (inv.trangThai === 'DA_THANH_TOAN') {
            const amount = Number(inv.tongTien) || 0;
            if (Number(inv.nam) === curYear) {
              doanhThuNam += amount;
              if (inv.thang >= 1 && inv.thang <= 12) {
                bieuDo[inv.thang - 1].doanhThu += amount;
              }
              if (Number(inv.thang) === curMonth) {
                doanhThuThang += amount;
              }
            }
          }
        });

        // Hợp đồng sắp hết hạn (30 ngày tới)
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() + 30);
        const todayStr = now.toISOString().split('T')[0];
        const limitStr = limitDate.toISOString().split('T')[0];

        const sapHetHanDTOs = [];
        contracts.forEach(c => {
          if (c.trangThai === 'DANG_HIEU_LUC' && c.ngayKetThuc) {
            const endStr = String(c.ngayKetThuc);
            if (endStr >= todayStr && endStr <= limitStr) {
              const diffDays = Math.ceil((new Date(endStr) - now) / (1000 * 60 * 60 * 24));
              const hoTen = c.khachThues && c.khachThues.length > 0 ? c.khachThues[0].hoTen : 'Chưa có khách';
              const sdt = c.khachThues && c.khachThues.length > 0 ? c.khachThues[0].soDienThoai : '';
              sapHetHanDTOs.push({
                id: c.id,
                soPhong: c.phong ? c.phong.soPhong : '—',
                hoTen,
                soDienThoai: sdt,
                ngayKetThuc: endStr,
                soNgayConLai: diffDays
              });
            }
          }
        });

        return {
          success: true,
          data: {
            tongSoPhong,
            soPhongTrong,
            soPhongDaThue,
            soPhongDangSua,
            tongKhachThue,
            soHoaDonChuaThanhToan,
            doanhThuThang,
            doanhThuNam,
            hopDongSapHetHan: sapHetHanDTOs,
            bieuDoDoanhThu: bieuDo
          }
        };
      }

      return { success: false, message: 'Endpoint không hỗ trợ: ' + path };
    } catch (err) {
      console.error('Lỗi GET:', err);
      return { success: false, message: err.message };
    }
  },

  post: async (endpoint, body) => {
    const firestore = await ensureDB();
    const [path] = endpoint.split('?');

    try {
      // 1. CẤU HÌNH
      if (path === '/cau-hinh') {
        await firestore.collection('cau_hinh').doc('main').set(body, { merge: true });
        return { success: true, message: 'Lưu cấu hình thành công!' };
      }

      // 2. PHÒNG
      if (path === '/phong') {
        const snap = await firestore.collection('phong').get();
        const rooms = snap.docs.map(docToData);
        const kv = body.khuVuc || '';
        const exists = rooms.some(r => r.soPhong === body.soPhong && (r.khuVuc || '') === kv);
        if (exists) {
          return { success: false, message: `Số phòng '${body.soPhong}' ${kv ? '(Khu ' + kv + ')' : ''} đã tồn tại!` };
        }
        const maxId = rooms.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0);
        const newId = maxId + 1;
        const newRoom = {
          ...body,
          id: newId,
          khuVuc: kv,
          chiSoDien: Number(body.chiSoDien) || 0,
          chiSoNuoc: Number(body.chiSoNuoc) || 0,
          giaThue: Number(body.giaThue) || 0,
          trangThai: body.trangThai || 'TRONG',
          ngayTao: new Date().toISOString()
        };
        await firestore.collection('phong').doc(String(newId)).set(newRoom);
        return { success: true, data: newRoom, message: 'Tạo phòng thành công!' };
      }

      // 3. KHÁCH THUÊ
      if (path === '/khach-thue') {
        const snap = await firestore.collection('khach_thue').get();
        const tenants = snap.docs.map(docToData);
        if (body.cccd && body.cccd.trim()) {
          const exists = tenants.some(t => t.cccd === body.cccd.trim());
          if (exists) return { success: false, message: `CCCD '${body.cccd}' đã được đăng ký!` };
        }
        const maxId = tenants.reduce((max, t) => Math.max(max, Number(t.id) || 0), 0);
        const newId = maxId + 1;
        const newTenant = {
          ...body,
          id: newId,
          cccd: body.cccd ? body.cccd.trim() : null,
          soDienThoai: body.soDienThoai ? body.soDienThoai.trim() : null,
          ngayTao: new Date().toISOString()
        };
        await firestore.collection('khach_thue').doc(String(newId)).set(newTenant);
        return { success: true, data: newTenant, message: 'Thêm khách thuê thành công!' };
      }

      // 4. HỢP ĐỒNG
      if (path === '/hop-dong') {
        const cSnap = await firestore.collection('hop_dong').get();
        const contracts = cSnap.docs.map(docToData);
        const phongId = body.phong ? body.phong.id : null;
        if (!phongId) return { success: false, message: 'Chưa chọn phòng!' };

        // Kiểm tra phòng đã có hợp đồng hiệu lực chưa
        const active = contracts.find(c => c.trangThai === 'DANG_HIEU_LUC' && c.phong && String(c.phong.id) === String(phongId));
        if (active) return { success: false, message: 'Phòng này đang có hợp đồng hiệu lực!' };

        const maxId = contracts.reduce((max, c) => Math.max(max, Number(c.id) || 0), 0);
        const newId = maxId + 1;
        const newContract = {
          ...body,
          id: newId,
          trangThai: 'DANG_HIEU_LUC',
          ngayTao: new Date().toISOString()
        };
        await firestore.collection('hop_dong').doc(String(newId)).set(newContract);

        // Cập nhật trạng thái phòng -> DA_THUE & đồng bộ giá / chỉ số
        const pDoc = await firestore.collection('phong').doc(String(phongId)).get();
        if (pDoc.exists) {
          const pUpdate = { trangThai: 'DA_THUE' };
          if (body.giaThueHopDong) pUpdate.giaThue = Number(body.giaThueHopDong);
          if (body.chiSoDienBanDau !== undefined) pUpdate.chiSoDien = Number(body.chiSoDienBanDau);
          if (body.chiSoNuocBanDau !== undefined) pUpdate.chiSoNuoc = Number(body.chiSoNuocBanDau);
          await firestore.collection('phong').doc(String(phongId)).update(pUpdate);
        }

        return { success: true, data: newContract, message: 'Tạo hợp đồng thành công!' };
      }

      // 5. HÓA ĐƠN
      if (path === '/hoa-don') {
        const invSnap = await firestore.collection('hoa_don').get();
        const invoices = invSnap.docs.map(docToData);
        const phongId = body.phong ? body.phong.id : null;
        if (!phongId) return { success: false, message: 'Chưa chọn phòng!' };

        const dup = invoices.find(i => i.phong && String(i.phong.id) === String(phongId) && Number(i.thang) === Number(body.thang) && Number(i.nam) === Number(body.nam));
        if (dup) {
          return { success: false, message: `Đã tạo hóa đơn cho phòng này tháng ${body.thang}/${body.nam} rồi!` };
        }

        // Tính tổng tiền
        const dien = Math.max(0, (Number(body.chiSoDienMoi) || 0) - (Number(body.chiSoDienCu) || 0)) * (Number(body.donGiaDien) || 0);
        const nuoc = Math.max(0, (Number(body.chiSoNuocMoi) || 0) - (Number(body.chiSoNuocCu) || 0)) * (Number(body.donGiaNuoc) || 0);
        const giam = Number(body.giamGia) || 0;
        const tongTien = Math.max(0, (Number(body.tienPhong) || 0) + dien + nuoc + (Number(body.phiInternet) || 0) + (Number(body.phiRac) || 0) + (Number(body.phiGuiXe) || 0) + (Number(body.phiKhac) || 0) - giam);

        const maxId = invoices.reduce((max, i) => Math.max(max, Number(i.id) || 0), 0);
        const newId = maxId + 1;
        const newInvoice = {
          ...body,
          id: newId,
          tongTien,
          trangThai: body.trangThai || 'CHUA_THANH_TOAN',
          ngayTao: new Date().toISOString()
        };
        await firestore.collection('hoa_don').doc(String(newId)).set(newInvoice);

        // Cập nhật chỉ số điện nước mới vào phòng
        const pDoc = await firestore.collection('phong').doc(String(phongId)).get();
        if (pDoc.exists) {
          const p = pDoc.data();
          const pUpdate = {};
          if (body.chiSoDienMoi) pUpdate.chiSoDien = Number(body.chiSoDienMoi);
          if (body.chiSoNuocMoi) pUpdate.chiSoNuoc = Number(body.chiSoNuocMoi);
          if (body.tienPhong) pUpdate.giaThue = Number(body.tienPhong);
          await firestore.collection('phong').doc(String(phongId)).update(pUpdate);

          // Tự tạo hợp đồng nếu phòng chưa có hợp đồng hiệu lực
          const cSnap = await firestore.collection('hop_dong').get();
          const hasActive = cSnap.docs.map(docToData).some(c => c.trangThai === 'DANG_HIEU_LUC' && c.phong && String(c.phong.id) === String(phongId));
          if (!hasActive) {
            const maxCId = cSnap.docs.map(docToData).reduce((m, c) => Math.max(m, Number(c.id) || 0), 0) + 1;
            await firestore.collection('hop_dong').doc(String(maxCId)).set({
              id: maxCId,
              phong: { id: p.id, soPhong: p.soPhong, khuVuc: p.khuVuc },
              ngayBatDau: `${body.nam}-${String(body.thang).padStart(2,'0')}-01`,
              ngayKetThuc: `${body.nam + 5}-01-01`,
              giaThueHopDong: Number(body.tienPhong) || p.giaThue || 0,
              chiSoDienBanDau: Number(body.chiSoDienMoi) || p.chiSoDien || 0,
              chiSoNuocBanDau: Number(body.chiSoNuocMoi) || p.chiSoNuoc || 0,
              tienCoc: 0,
              ngayTraTien: 5,
              khachThues: [],
              trangThai: 'DANG_HIEU_LUC',
              ngayTao: new Date().toISOString()
            });
            await firestore.collection('phong').doc(String(phongId)).update({ trangThai: 'DA_THUE' });
          }
        }

        return { success: true, data: newInvoice, message: 'Tạo hóa đơn thành công!' };
      }

      return { success: false, message: 'Endpoint không hỗ trợ: ' + path };
    } catch (err) {
      console.error('Lỗi POST:', err);
      return { success: false, message: err.message };
    }
  },

  put: async (endpoint, body) => {
    const firestore = await ensureDB();
    const [path] = endpoint.split('?');
    const parts = path.split('/');

    try {
      // 1. PHÒNG: /phong/:id hoặc /phong/:id/chi-so
      if (parts[1] === 'phong') {
        const id = parts[2];
        if (parts[3] === 'chi-so') {
          const update = {};
          if (body.chiSoDien !== undefined) update.chiSoDien = Number(body.chiSoDien);
          if (body.chiSoNuoc !== undefined) update.chiSoNuoc = Number(body.chiSoNuoc);
          await firestore.collection('phong').doc(String(id)).update(update);
          return { success: true, message: 'Cập nhật chỉ số thành công!' };
        }
        await firestore.collection('phong').doc(String(id)).update({
          ...body,
          ngayCapNhat: new Date().toISOString()
        });
        const doc = await firestore.collection('phong').doc(String(id)).get();
        return { success: true, data: docToData(doc), message: 'Cập nhật phòng thành công!' };
      }

      // 2. KHÁCH THUÊ: /khach-thue/:id
      if (parts[1] === 'khach-thue') {
        const id = parts[2];
        await firestore.collection('khach_thue').doc(String(id)).update({
          ...body,
          ngayCapNhat: new Date().toISOString()
        });
        const doc = await firestore.collection('khach_thue').doc(String(id)).get();
        return { success: true, data: docToData(doc), message: 'Cập nhật khách thuê thành công!' };
      }

      // 3. HỢP ĐỒNG: /hop-dong/:id hoặc /hop-dong/:id/ket-thuc
      if (parts[1] === 'hop-dong') {
        const id = parts[2];
        const sub = parts[3];

        if (sub === 'ket-thuc') {
          const hDoc = await firestore.collection('hop_dong').doc(String(id)).get();
          if (!hDoc.exists) return { success: false, message: 'Không tìm thấy hợp đồng' };
          const hData = hDoc.data();

          const update = {
            trangThai: 'DA_KET_THUC',
            ngayKetThucThucTe: new Date().toISOString().split('T')[0]
          };
          await firestore.collection('hop_dong').doc(String(id)).update(update);

          // Giải phóng phòng -> TRONG
          if (hData.phong && hData.phong.id) {
            const pUpdate = { trangThai: 'TRONG' };
            if (body && body.chiSoDienMoi !== undefined) pUpdate.chiSoDien = Number(body.chiSoDienMoi);
            if (body && body.chiSoNuocMoi !== undefined) pUpdate.chiSoNuoc = Number(body.chiSoNuocMoi);
            await firestore.collection('phong').doc(String(hData.phong.id)).update(pUpdate);
          }

          return { success: true, message: 'Kết thúc hợp đồng thành công!' };
        }

        // Cập nhật hợp đồng thông thường (xử lý đổi phòng nếu có)
        const oldHDoc = await firestore.collection('hop_dong').doc(String(id)).get();
        const oldHD = oldHDoc.exists ? oldHDoc.data() : null;

        if (oldHD && body.phong && oldHD.phong && String(body.phong.id) !== String(oldHD.phong.id)) {
          // Trả phòng cũ về TRONG
          await firestore.collection('phong').doc(String(oldHD.phong.id)).update({ trangThai: 'TRONG' });
          // Chuyển phòng mới sang DA_THUE
          await firestore.collection('phong').doc(String(body.phong.id)).update({ trangThai: 'DA_THUE' });
        }

        await firestore.collection('hop_dong').doc(String(id)).update({
          ...body,
          ngayCapNhat: new Date().toISOString()
        });
        const doc = await firestore.collection('hop_dong').doc(String(id)).get();
        return { success: true, data: docToData(doc), message: 'Cập nhật hợp đồng thành công!' };
      }

      // 4. HÓA ĐƠN: /hoa-don/:id, /hoa-don/:id/thanh-toan, /hoa-don/:id/ky-tinh-tien
      if (parts[1] === 'hoa-don') {
        const id = parts[2];
        const sub = parts[3];

        if (sub === 'thanh-toan') {
          const pt = (body && body.phuongThuc) ? body.phuongThuc : 'Tiền mặt/Chuyển khoản';
          const update = {
            trangThai: 'DA_THANH_TOAN',
            ngayThanhToan: new Date().toISOString().split('T')[0],
            phuongThucThanhToan: pt
          };
          await firestore.collection('hoa_don').doc(String(id)).update(update);
          const doc = await firestore.collection('hoa_don').doc(String(id)).get();
          return { success: true, data: docToData(doc), message: 'Thanh toán thành công!' };
        }

        if (sub === 'ky-tinh-tien') {
          await firestore.collection('hoa_don').doc(String(id)).update({
            tuNgay: body.tuNgay,
            denNgay: body.denNgay
          });
          const doc = await firestore.collection('hoa_don').doc(String(id)).get();
          return { success: true, data: docToData(doc), message: 'Cập nhật kỳ tính tiền thành công!' };
        }

        // Cập nhật hóa đơn bình thường
        const dien = Math.max(0, (Number(body.chiSoDienMoi) || 0) - (Number(body.chiSoDienCu) || 0)) * (Number(body.donGiaDien) || 0);
        const nuoc = Math.max(0, (Number(body.chiSoNuocMoi) || 0) - (Number(body.chiSoNuocCu) || 0)) * (Number(body.donGiaNuoc) || 0);
        const giam = Number(body.giamGia) || 0;
        const tongTien = Math.max(0, (Number(body.tienPhong) || 0) + dien + nuoc + (Number(body.phiInternet) || 0) + (Number(body.phiRac) || 0) + (Number(body.phiGuiXe) || 0) + (Number(body.phiKhac) || 0) - giam);

        await firestore.collection('hoa_don').doc(String(id)).update({
          ...body,
          tongTien,
          ngayCapNhat: new Date().toISOString()
        });

        if (body.phong && body.phong.id) {
          const pUpdate = {};
          if (body.chiSoDienMoi) pUpdate.chiSoDien = Number(body.chiSoDienMoi);
          if (body.chiSoNuocMoi) pUpdate.chiSoNuoc = Number(body.chiSoNuocMoi);
          if (body.tienPhong) pUpdate.giaThue = Number(body.tienPhong);
          await firestore.collection('phong').doc(String(body.phong.id)).update(pUpdate);
        }

        const doc = await firestore.collection('hoa_don').doc(String(id)).get();
        return { success: true, data: docToData(doc), message: 'Cập nhật hóa đơn thành công!' };
      }

      return { success: false, message: 'Endpoint không hỗ trợ: ' + path };
    } catch (err) {
      console.error('Lỗi PUT:', err);
      return { success: false, message: err.message };
    }
  },

  delete: async (endpoint) => {
    const firestore = await ensureDB();
    const [path] = endpoint.split('?');
    const parts = path.split('/');

    try {
      // 1. PHÒNG: /phong/:id
      if (parts[1] === 'phong') {
        const id = parts[2];
        const cSnap = await firestore.collection('hop_dong').get();
        const hasActive = cSnap.docs.map(docToData).some(c => c.trangThai === 'DANG_HIEU_LUC' && c.phong && String(c.phong.id) === String(id));
        if (hasActive) {
          return { success: false, message: 'Phòng đang có hợp đồng hiệu lực, không thể xóa!' };
        }
        await firestore.collection('phong').doc(String(id)).delete();
        return { success: true, message: 'Xóa phòng thành công!' };
      }

      // 2. KHÁCH THUÊ: /khach-thue/:id
      if (parts[1] === 'khach-thue') {
        const id = parts[2];
        await firestore.collection('khach_thue').doc(String(id)).delete();
        return { success: true, message: 'Xóa khách thuê thành công!' };
      }

      // 3. HỢP ĐỒNG: /hop-dong/:id hoặc /hop-dong/:id/vinh-vien
      if (parts[1] === 'hop-dong') {
        const id = parts[2];
        const isVinhVien = parts[3] === 'vinh-vien';

        const hDoc = await firestore.collection('hop_dong').doc(String(id)).get();
        const hData = hDoc.exists ? hDoc.data() : null;

        if (isVinhVien) {
          await firestore.collection('hop_dong').doc(String(id)).delete();
          return { success: true, message: 'Xóa vĩnh viễn hợp đồng thành công!' };
        } else {
          // Xóa mềm: chuyển sang DA_HUY & giải phóng phòng
          await firestore.collection('hop_dong').doc(String(id)).update({ trangThai: 'DA_HUY' });
          if (hData && hData.phong && hData.phong.id) {
            await firestore.collection('phong').doc(String(hData.phong.id)).update({ trangThai: 'TRONG' });
          }
          return { success: true, message: 'Chuyển hợp đồng sang Đã xóa gần đây!' };
        }
      }

      // 4. HÓA ĐƠN: /hoa-don/:id hoặc /hoa-don/tat-ca
      if (parts[1] === 'hoa-don') {
        const id = parts[2];
        if (id === 'tat-ca') {
          const snap = await firestore.collection('hoa_don').get();
          const batch = firestore.batch();
          snap.docs.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
          return { success: true, message: 'Đã xóa toàn bộ hóa đơn!' };
        }
        await firestore.collection('hoa_don').doc(String(id)).delete();
        return { success: true, message: 'Xóa hóa đơn thành công!' };
      }

      return { success: false, message: 'Endpoint không hỗ trợ: ' + path };
    } catch (err) {
      console.error('Lỗi DELETE:', err);
      return { success: false, message: err.message };
    }
  }
};

// ==============================================================================
// GIAO DIỆN & TIỆN ÍCH CHUNG (Giữ nguyên 100% từ code cũ)
// ==============================================================================

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container') || createToastContainer();
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
      <span class="toast-msg">${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function createToastContainer() {
  const div = document.createElement('div');
  div.id = 'toast-container';
  div.className = 'toast-container';
  document.body.appendChild(div);
  return div;
}

function openModal(modalId) {
  document.getElementById(modalId).classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
  document.body.style.overflow = '';
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('show');
    document.body.style.overflow = '';
  }
});

function formatCurrency(amount) {
  if (!amount && amount !== 0) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN');
}

function formatDateTime(dtStr) {
  if (!dtStr) return '—';
  const d = new Date(dtStr);
  return d.toLocaleString('vi-VN');
}

function trangThaiPhongBadge(tt) {
  const map = {
    'TRONG': `<span class="badge badge-success">🏠 Trống</span>`,
    'DA_THUE': `<span class="badge badge-info">👥 Đã thuê</span>`,
    'DANG_SUA': `<span class="badge badge-warning">🔧 Đang sửa</span>`,
  };
  return map[tt] || `<span class="badge badge-gray">${tt}</span>`;
}

function trangThaiHopDongBadge(tt) {
  const map = {
    'DANG_HIEU_LUC': `<span class="badge badge-success">✅ Hiệu lực</span>`,
    'DA_KET_THUC': `<span class="badge badge-gray">🔚 Đã kết thúc</span>`,
    'DA_HUY': `<span class="badge badge-warning">🗑️ Đã xóa gần đây</span>`,
  };
  return map[tt] || `<span class="badge badge-gray">${tt}</span>`;
}

function trangThaiHoaDonBadge(tt) {
  const map = {
    'CHUA_THANH_TOAN': `<span class="badge badge-warning">⏳ Chưa TT</span>`,
    'DA_THANH_TOAN': `<span class="badge badge-success">✅ Đã TT</span>`,
  };
  return map[tt] || `<span class="badge badge-gray">${tt}</span>`;
}

function gioiTinhLabel(g) {
  const map = { 'NAM': '♂ Nam', 'NU': '♀ Nữ', 'KHAC': '— Khác' };
  return map[g] || g;
}

function confirmAction(message, callback) {
  if (confirm(message)) callback();
}

function parseNum(val) {
  if (val === null || val === undefined) return 0;
  const n = parseFloat(String(val).replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
}

function formatMoney(value) {
  if (value === null || value === undefined || value === '') return '';
  const num = parseFloat(String(value).replace(/,/g, ''));
  if (isNaN(num)) return '';
  if (num === 0) return '0';
  return Math.round(num).toLocaleString('en-US');
}

function applyMoneyInput(el, { autoScale = true, onUpdate = null } = {}) {
  if (!el) return;
  el.addEventListener('focus', function () {
    const raw = parseNum(this.value);
    this.value = raw > 0 ? raw : '';
    try { this.select(); } catch (e) {}
  });
  el.addEventListener('blur', function () {
    let raw = parseNum(this.value);
    if (autoScale && raw > 0 && raw <= 100000) raw = raw * 1000;
    this.value = raw > 0 ? formatMoney(raw) : '0';
    if (onUpdate) onUpdate();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initBottomNav();
});

function initBottomNav() {
  if (document.querySelector('.bottom-nav')) return;

  const bottomNav = document.createElement('nav');
  bottomNav.className = 'bottom-nav';

  const menuItems = [
    { name: 'Phòng trọ', url: 'phong.html', icon: '🏘️' },
    { name: 'Khách thuê', url: 'khach-thue.html', icon: '👥' },
    { name: 'Hóa đơn', url: 'hoa-don.html', icon: '🧾' },
    { name: 'Chờ chốt', url: 'cho-chot.html', icon: '⏳' }
  ];

  const currentPath = window.location.pathname.toLowerCase();

  menuItems.forEach(item => {
    const a = document.createElement('a');
    a.href = item.url;
    a.className = 'bottom-nav-item';
    if (currentPath.includes(item.url.toLowerCase())) {
      a.className += ' active';
    }
    a.innerHTML = `
        <span class="bottom-nav-icon">${item.icon}</span>
        <span class="bottom-nav-text">${item.name}</span>
    `;
    bottomNav.appendChild(a);
  });

  document.body.appendChild(bottomNav);
}
