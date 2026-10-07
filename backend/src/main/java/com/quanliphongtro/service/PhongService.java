package com.quanliphongtro.service;

import com.quanliphongtro.entity.Phong;
import com.quanliphongtro.entity.HopDong;
import com.quanliphongtro.entity.HoaDon;
import com.quanliphongtro.repository.PhongRepository;
import com.quanliphongtro.repository.HopDongRepository;
import com.quanliphongtro.repository.HoaDonRepository;
 
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class PhongService {

    private final PhongRepository phongRepository;
    private final HopDongRepository hopDongRepository;
    private final HoaDonRepository hoaDonRepository;

    public PhongService(PhongRepository phongRepository,
                        HopDongRepository hopDongRepository,
                        HoaDonRepository hoaDonRepository) {
        this.phongRepository = phongRepository;
        this.hopDongRepository = hopDongRepository;
        this.hoaDonRepository = hoaDonRepository;
    }

    public List<Phong> getAllPhong() {
        return phongRepository.findAll();
    }

    public Phong getPhongById(Long id) {
        return phongRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng với ID: " + id));
    }

    public List<Phong> getPhongByTrangThai(Phong.TrangThaiPhong trangThai) {
        return phongRepository.findByTrangThai(trangThai);
    }

    public Phong createPhong(Phong phong) {
        if (phong.getKhuVuc() == null) {
            phong.setKhuVuc("");
        }
        if (phongRepository.existsBySoPhongAndKhuVuc(phong.getSoPhong(), phong.getKhuVuc())) {
            String kvPrefix = phong.getKhuVuc().isEmpty() ? "" : " (Khu " + phong.getKhuVuc() + ")";
            throw new RuntimeException("Số phòng '" + phong.getSoPhong() + "'" + kvPrefix + " đã tồn tại!");
        }
        return phongRepository.save(phong);
    }

    public Phong updatePhong(Long id, Phong phongDetails) {
        Phong phong = getPhongById(id);
        if (phongDetails.getKhuVuc() == null) {
            phongDetails.setKhuVuc("");
        }
        
        boolean isSoPhongChanged = !phong.getSoPhong().equals(phongDetails.getSoPhong());
        boolean isKhuVucChanged = !phong.getKhuVuc().equals(phongDetails.getKhuVuc());
        
        if ((isSoPhongChanged || isKhuVucChanged) &&
                phongRepository.existsBySoPhongAndKhuVuc(phongDetails.getSoPhong(), phongDetails.getKhuVuc())) {
            String kvPrefix = phongDetails.getKhuVuc().isEmpty() ? "" : " (Khu " + phongDetails.getKhuVuc() + ")";
            throw new RuntimeException("Số phòng '" + phongDetails.getSoPhong() + "'" + kvPrefix + " đã tồn tại!");
        }
        
        phong.setSoPhong(phongDetails.getSoPhong());
        phong.setKhuVuc(phongDetails.getKhuVuc());
        phong.setDienTich(phongDetails.getDienTich());
        phong.setGiaThue(phongDetails.getGiaThue());
        phong.setMoTa(phongDetails.getMoTa());
        phong.setTrangThai(phongDetails.getTrangThai());
        return phongRepository.save(phong);
    }

    public void deletePhong(Long id) {
        Phong phong = getPhongById(id);
        if (phong.getTrangThai() == Phong.TrangThaiPhong.DA_THUE) {
            throw new RuntimeException("Không thể xóa phòng đang có người thuê!");
        }
        phongRepository.deleteById(id);
    }

    public long countByTrangThai(Phong.TrangThaiPhong trangThai) {
        return phongRepository.countByTrangThai(trangThai);
    }

    public long countTotal() {
        return phongRepository.count();
    }

    public void updateChiSoDienNuoc(Long phongId, Double chiSoDien, Double chiSoNuoc) {
        // Cập nhật vào thông tin Phòng gốc (cho các phòng trống)
        Phong phong = getPhongById(phongId);
        if (chiSoDien != null) phong.setChiSoDien(chiSoDien);
        if (chiSoNuoc != null) phong.setChiSoNuoc(chiSoNuoc);
        phongRepository.save(phong);

        // Ưu tiên: nếu phòng đã có hóa đơn → cập nhật chi số mới của hóa đơn gần nhất
        Optional<HoaDon> latestHoaDon = hoaDonRepository.findTopByPhongIdOrderByNamDescThangDesc(phongId);
        if (latestHoaDon.isPresent()) {
            HoaDon hd = latestHoaDon.get();
            if (chiSoDien != null) hd.setChiSoDienMoi(chiSoDien);
            if (chiSoNuoc != null) hd.setChiSoNuocMoi(chiSoNuoc);
            hd.tinhTongTien();
            hoaDonRepository.save(hd);
            return;
        }
        
        // Nếu chưa có hóa đơn → cập nhật chỉ số ban đầu của hợp đồng (nếu có hợp đồng)
        Optional<HopDong> hopDongOpt = hopDongRepository.findByPhongIdAndTrangThai(phongId, HopDong.TrangThaiHopDong.DANG_HIEU_LUC);
        if (hopDongOpt.isPresent()) {
            HopDong hopDong = hopDongOpt.get();
            if (chiSoDien != null) hopDong.setChiSoDienBanDau(chiSoDien);
            if (chiSoNuoc != null) hopDong.setChiSoNuocBanDau(chiSoNuoc);
            hopDongRepository.save(hopDong);
        }
    }
}
