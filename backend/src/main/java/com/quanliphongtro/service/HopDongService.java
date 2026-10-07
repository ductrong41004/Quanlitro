package com.quanliphongtro.service;

import com.quanliphongtro.entity.HopDong;
import com.quanliphongtro.entity.KhachThue;
import com.quanliphongtro.entity.Phong;
import com.quanliphongtro.repository.HopDongRepository;
import com.quanliphongtro.repository.PhongRepository;
 
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class HopDongService {

    private final HopDongRepository hopDongRepository;
    private final PhongRepository phongRepository;

    public HopDongService(HopDongRepository hopDongRepository, PhongRepository phongRepository) {
        this.hopDongRepository = hopDongRepository;
        this.phongRepository = phongRepository;
    }

    public List<HopDong> getAllHopDong() {
        return hopDongRepository.findAll();
    }

    public HopDong getHopDongById(Long id) {
        return hopDongRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hợp đồng với ID: " + id));
    }

    public List<HopDong> getHopDongByTrangThai(HopDong.TrangThaiHopDong trangThai) {
        return hopDongRepository.findByTrangThai(trangThai);
    }

    public List<HopDong> getHopDongByPhong(Long phongId) {
        return hopDongRepository.findByPhongId(phongId);
    }

    public List<HopDong> getHopDongByKhachThue(Long khachThueId) {
        return hopDongRepository.findByKhachThues_Id(khachThueId);
    }

    public List<HopDong> getHopDongSapHetHan(int soNgay) {
        LocalDate ngayGioiHan = LocalDate.now().plusDays(soNgay);
        return hopDongRepository.findHopDongSapHetHan(ngayGioiHan);
    }

    public HopDong createHopDong(HopDong hopDong) {
        // Kiểm tra phòng có đang được thuê không
        hopDongRepository.findByPhongIdAndTrangThai(
                hopDong.getPhong().getId(), HopDong.TrangThaiHopDong.DANG_HIEU_LUC
        ).ifPresent(hd -> {
            throw new RuntimeException("Phòng này đang có hợp đồng hiệu lực!");
        });

        HopDong saved = hopDongRepository.save(hopDong);

        // Cập nhật trạng thái phòng → ĐÃ THUÊ + đồng bộ giá thuê
        Phong phong = phongRepository.findById(hopDong.getPhong().getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng!"));
        phong.setTrangThai(Phong.TrangThaiPhong.DA_THUE);
        if (hopDong.getGiaThueHopDong() != null
                && hopDong.getGiaThueHopDong().compareTo(java.math.BigDecimal.ZERO) > 0) {
            phong.setGiaThue(hopDong.getGiaThueHopDong());
        }
        if (hopDong.getChiSoDienBanDau() != null) phong.setChiSoDien(hopDong.getChiSoDienBanDau());
        if (hopDong.getChiSoNuocBanDau() != null) phong.setChiSoNuoc(hopDong.getChiSoNuocBanDau());
        phongRepository.save(phong);

        return saved;
    }

    public HopDong updateHopDong(Long id, HopDong hopDongDetails) {
        HopDong hopDong = getHopDongById(id);
        
        // Handle Room Change
        if (hopDongDetails.getPhong() != null && !hopDong.getPhong().getId().equals(hopDongDetails.getPhong().getId())) {
            Phong newPhong = phongRepository.findById(hopDongDetails.getPhong().getId())
                    .orElseThrow(() -> new RuntimeException("Phòng chuyển đến không tồn tại!"));
            if (newPhong.getTrangThai() != Phong.TrangThaiPhong.TRONG) {
                throw new RuntimeException("Phòng chuyển đến đang có người sử dụng!");
            }
            // Giải phóng phòng cũ
            Phong oldPhong = hopDong.getPhong();
            oldPhong.setTrangThai(Phong.TrangThaiPhong.TRONG);
            phongRepository.save(oldPhong);
            
            // Vào phòng mới
            newPhong.setTrangThai(Phong.TrangThaiPhong.DA_THUE);
            phongRepository.save(newPhong);
            
            hopDong.setPhong(newPhong);
        }

        hopDong.setNgayKetThuc(hopDongDetails.getNgayKetThuc());
        hopDong.setGiaThueHopDong(hopDongDetails.getGiaThueHopDong());
        hopDong.setTienCoc(hopDongDetails.getTienCoc());
        hopDong.setNgayTraTien(hopDongDetails.getNgayTraTien());
        hopDong.setChiSoDienBanDau(hopDongDetails.getChiSoDienBanDau());
        hopDong.setChiSoNuocBanDau(hopDongDetails.getChiSoNuocBanDau());
        hopDong.setTrangThai(hopDongDetails.getTrangThai());
        hopDong.setGhiChu(hopDongDetails.getGhiChu());
        
        // Đồng bộ lại chỉ số cho phòng nếu có thay đổi
        if (hopDongDetails.getChiSoDienBanDau() != null || hopDongDetails.getChiSoNuocBanDau() != null) {
            Phong p = hopDong.getPhong();
            if (hopDongDetails.getChiSoDienBanDau() != null) p.setChiSoDien(hopDongDetails.getChiSoDienBanDau());
            if (hopDongDetails.getChiSoNuocBanDau() != null) p.setChiSoNuoc(hopDongDetails.getChiSoNuocBanDau());
            phongRepository.save(p);
        }

        // Đồng bộ giá thuê → cập nhật giá phòng hiện tại
        if (hopDongDetails.getGiaThueHopDong() != null
                && hopDongDetails.getGiaThueHopDong().compareTo(java.math.BigDecimal.ZERO) > 0) {
            Phong currentPhong = hopDong.getPhong();
            currentPhong.setGiaThue(hopDongDetails.getGiaThueHopDong());
            phongRepository.save(currentPhong);
        }
        
        if (hopDongDetails.getKhachThues() != null) {
            if (hopDongDetails.getKhachThues().isEmpty()) {
                throw new RuntimeException("Hợp đồng phải có ít nhất 1 khách đang thuê!");
            }
            hopDong.setKhachThues(hopDongDetails.getKhachThues());
        }

        return hopDongRepository.save(hopDong);
    }

    public HopDong ketThucHopDong(Long id, Double chiSoDienMoi, Double chiSoNuocMoi) {
        HopDong hopDong = getHopDongById(id);
        hopDong.setTrangThai(HopDong.TrangThaiHopDong.DA_KET_THUC);
        hopDong.setNgayKetThucThucTe(LocalDate.now());
        hopDongRepository.save(hopDong);

        // Cập nhật trạng thái phòng → TRỐNG
        // Nếu có chỉ số cuối kỳ, lưu lại làm số đầu kỳ cho khách tiếp theo
        Phong phong = hopDong.getPhong();
        phong.setTrangThai(Phong.TrangThaiPhong.TRONG);
        if (chiSoDienMoi != null) phong.setChiSoDien(chiSoDienMoi);
        if (chiSoNuocMoi != null) phong.setChiSoNuoc(chiSoNuocMoi);
        phongRepository.save(phong);

        return hopDong;
    }

    // Xóa mềm (soft delete): DA_KET_THUC → DA_HUY
    public void deleteHopDong(Long id) {
        HopDong hopDong = getHopDongById(id);
        if (hopDong.getTrangThai() == HopDong.TrangThaiHopDong.DANG_HIEU_LUC) {
            throw new RuntimeException("Không thể xóa hợp đồng đang hiệu lực! Hãy kết thúc hợp đồng trước.");
        }
        if (hopDong.getTrangThai() == HopDong.TrangThaiHopDong.DA_HUY) {
            throw new RuntimeException("Hợp đồng đã ở trạng thái xóa gần đây. Dùng Xóa Vĩnh Viễn để xóa hoàn toàn.");
        }
        // Soft delete: chuyển DA_KET_THUC → DA_HUY
        hopDong.setTrangThai(HopDong.TrangThaiHopDong.DA_HUY);
        hopDongRepository.save(hopDong);
    }

    // Xóa vĩnh viễn (hard delete): chỉ cho phép với hợp đồng DA_HUY
    public void deleteHopDongVinhVien(Long id) {
        HopDong hopDong = getHopDongById(id);
        if (hopDong.getTrangThai() != HopDong.TrangThaiHopDong.DA_HUY) {
            throw new RuntimeException("Chỉ có thể xóa vĩnh viễn hợp đồng ở trạng thái \"Xóa gần đây\"!");
        }
        hopDongRepository.deleteById(id);
    }
}
