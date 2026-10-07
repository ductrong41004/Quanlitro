package com.quanliphongtro.service;

import com.quanliphongtro.entity.HoaDon;
import com.quanliphongtro.repository.HoaDonRepository;
import com.quanliphongtro.entity.HopDong;
import com.quanliphongtro.repository.HopDongRepository;
import com.quanliphongtro.entity.Phong;
import com.quanliphongtro.repository.PhongRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
public class HoaDonService {

    private final HoaDonRepository hoaDonRepository;
    private final HopDongRepository hopDongRepository;
    private final PhongRepository phongRepository;

    public HoaDonService(HoaDonRepository hoaDonRepository, HopDongRepository hopDongRepository, PhongRepository phongRepository) {
        this.hoaDonRepository = hoaDonRepository;
        this.hopDongRepository = hopDongRepository;
        this.phongRepository = phongRepository;
    }

    public List<HoaDon> getAllHoaDon() {
        return hoaDonRepository.findAll();
    }

    public HoaDon getHoaDonById(Long id) {
        return hoaDonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn với ID: " + id));
    }

    public List<HoaDon> getHoaDonByPhong(Long phongId) {
        return hoaDonRepository.findByPhongId(phongId);
    }

    public List<HoaDon> getHoaDonByThangNam(Integer thang, Integer nam) {
        return hoaDonRepository.findByThangAndNam(thang, nam);
    }

    public List<HoaDon> getHoaDonChuaThanhToan() {
        return hoaDonRepository.findByTrangThai(HoaDon.TrangThaiHoaDon.CHUA_THANH_TOAN);
    }

    public HoaDon createHoaDon(HoaDon hoaDon) {
        // Kiểm tra đã tạo hóa đơn cho phòng này tháng này chưa
        hoaDonRepository.findByPhongIdAndThangAndNam(
                hoaDon.getPhong().getId(), hoaDon.getThang(), hoaDon.getNam()
        ).ifPresent(hd -> {
            throw new RuntimeException("Đã tạo hóa đơn cho phòng " + hoaDon.getPhong().getSoPhong()
                    + " tháng " + hoaDon.getThang() + "/" + hoaDon.getNam() + " rồi!");
        });
        hoaDon.tinhTongTien();
        
        Optional<Phong> pOpt = phongRepository.findById(hoaDon.getPhong().getId());
        if (pOpt.isPresent()) {
            Phong p = pOpt.get();
            if (hoaDon.getChiSoDienMoi() != null && hoaDon.getChiSoDienMoi() > 0) p.setChiSoDien(hoaDon.getChiSoDienMoi());
            if (hoaDon.getChiSoNuocMoi() != null && hoaDon.getChiSoNuocMoi() > 0) p.setChiSoNuoc(hoaDon.getChiSoNuocMoi());
            if (hoaDon.getTienPhong() != null && hoaDon.getTienPhong().compareTo(BigDecimal.ZERO) > 0) p.setGiaThue(hoaDon.getTienPhong());
            phongRepository.save(p);

            // Tự động tạo hợp đồng nếu phòng chưa có hợp đồng đang hiệu lực
            boolean hasActiveContract = hopDongRepository.findByPhongIdAndTrangThai(
                    p.getId(), HopDong.TrangThaiHopDong.DANG_HIEU_LUC
            ).isPresent();

            if (!hasActiveContract) {
                HopDong autoHopDong = new HopDong();
                autoHopDong.setPhong(p);
                autoHopDong.setNgayBatDau(LocalDate.of(2026, 1, 1));
                autoHopDong.setNgayKetThuc(LocalDate.of(2030, 1, 1));
                BigDecimal giaThueHD = (hoaDon.getTienPhong() != null && hoaDon.getTienPhong().compareTo(BigDecimal.ZERO) > 0)
                        ? hoaDon.getTienPhong() : p.getGiaThue();
                autoHopDong.setGiaThueHopDong(giaThueHD);
                autoHopDong.setChiSoDienBanDau(hoaDon.getChiSoDienMoi() != null ? hoaDon.getChiSoDienMoi() : p.getChiSoDien());
                autoHopDong.setChiSoNuocBanDau(hoaDon.getChiSoNuocMoi() != null ? hoaDon.getChiSoNuocMoi() : p.getChiSoNuoc());
                autoHopDong.setTienCoc(BigDecimal.ZERO);
                autoHopDong.setNgayTraTien(5);
                autoHopDong.setKhachThues(new java.util.ArrayList<>());
                autoHopDong.setTrangThai(HopDong.TrangThaiHopDong.DANG_HIEU_LUC);
                hopDongRepository.save(autoHopDong);

                // Cập nhật trạng thái phòng → ĐÃ THUÊ
                p.setTrangThai(Phong.TrangThaiPhong.DA_THUE);
                phongRepository.save(p);
            }
        }

        return hoaDonRepository.save(hoaDon);
    }

    public HoaDon updateHoaDon(Long id, HoaDon hoaDonDetails) {
        HoaDon hoaDon = getHoaDonById(id);
        if (hoaDon.getTrangThai() == HoaDon.TrangThaiHoaDon.DA_THANH_TOAN) {
            throw new RuntimeException("Không thể sửa hóa đơn đã thanh toán!");
        }
        hoaDon.setChiSoDienCu(hoaDonDetails.getChiSoDienCu());
        hoaDon.setChiSoDienMoi(hoaDonDetails.getChiSoDienMoi());
        hoaDon.setDonGiaDien(hoaDonDetails.getDonGiaDien());
        hoaDon.setChiSoNuocCu(hoaDonDetails.getChiSoNuocCu());
        hoaDon.setChiSoNuocMoi(hoaDonDetails.getChiSoNuocMoi());
        hoaDon.setDonGiaNuoc(hoaDonDetails.getDonGiaNuoc());
        hoaDon.setTienPhong(hoaDonDetails.getTienPhong());
        hoaDon.setTuNgay(hoaDonDetails.getTuNgay());
        hoaDon.setDenNgay(hoaDonDetails.getDenNgay());
        hoaDon.setPhiInternet(hoaDonDetails.getPhiInternet());
        hoaDon.setPhiRac(hoaDonDetails.getPhiRac());
        hoaDon.setPhiGuiXe(hoaDonDetails.getPhiGuiXe());
        hoaDon.setPhiKhac(hoaDonDetails.getPhiKhac());
        hoaDon.setGhiChuPhiKhac(hoaDonDetails.getGhiChuPhiKhac());
        hoaDon.setGiamGia(hoaDonDetails.getGiamGia());
        hoaDon.setGhiChuGiamGia(hoaDonDetails.getGhiChuGiamGia());
        hoaDon.setGhiChu(hoaDonDetails.getGhiChu());
        hoaDon.tinhTongTien();
        
        Optional<Phong> pOpt = phongRepository.findById(hoaDon.getPhong().getId());
        if (pOpt.isPresent()) {
            Phong p = pOpt.get();
            if (hoaDon.getChiSoDienMoi() != null && hoaDon.getChiSoDienMoi() > 0) p.setChiSoDien(hoaDon.getChiSoDienMoi());
            if (hoaDon.getChiSoNuocMoi() != null && hoaDon.getChiSoNuocMoi() > 0) p.setChiSoNuoc(hoaDon.getChiSoNuocMoi());
            if (hoaDon.getTienPhong() != null && hoaDon.getTienPhong().compareTo(BigDecimal.ZERO) > 0) p.setGiaThue(hoaDon.getTienPhong());
            phongRepository.save(p);
        }

        return hoaDonRepository.save(hoaDon);
    }

    public HoaDon updateKyTinhTien(Long id, LocalDate tuNgay, LocalDate denNgay) {
        HoaDon hoaDon = getHoaDonById(id);
        hoaDon.setTuNgay(tuNgay);
        hoaDon.setDenNgay(denNgay);
        return hoaDonRepository.save(hoaDon);
    }

    public HoaDon thanhToan(Long id, String phuongThuc) {
        HoaDon hoaDon = getHoaDonById(id);
        if (hoaDon.getTrangThai() == HoaDon.TrangThaiHoaDon.DA_THANH_TOAN) {
            throw new RuntimeException("Hóa đơn này đã được thanh toán rồi!");
        }
        hoaDon.setTrangThai(HoaDon.TrangThaiHoaDon.DA_THANH_TOAN);
        hoaDon.setNgayThanhToan(LocalDate.now());
        hoaDon.setPhuongThucThanhToan(phuongThuc != null ? phuongThuc : "Tiền mặt");
        return hoaDonRepository.save(hoaDon);
    }

    public void deleteHoaDon(Long id) {
        HoaDon hoaDon = getHoaDonById(id);
        if (hoaDon.getTrangThai() == HoaDon.TrangThaiHoaDon.DA_THANH_TOAN) {
            throw new RuntimeException("Không thể xóa hóa đơn đã thanh toán!");
        }
        hoaDonRepository.deleteById(id);
    }

    public void deleteAllHoaDon() {
        hoaDonRepository.deleteAll();
    }

    public Map<String, Double> getChiSoCu(Long phongId) {
        Map<String, Double> chiSo = new HashMap<>();
        // 1. Tìm hoá đơn gần nhất của phòng này
        Optional<HoaDon> latest = hoaDonRepository.findTopByPhongIdOrderByNamDescThangDesc(phongId);
        if (latest.isPresent()) {
            chiSo.put("dien", latest.get().getChiSoDienMoi());
            chiSo.put("nuoc", latest.get().getChiSoNuocMoi());
        } else {
            // 2. Nếu phòng chưa có hoá đơn nào, lấy từ Hợp đồng đang hiệu lực
            Optional<HopDong> hd = hopDongRepository.findByPhongIdAndTrangThai(phongId, HopDong.TrangThaiHopDong.DANG_HIEU_LUC);
            if (hd.isPresent()) {
                chiSo.put("dien", hd.get().getChiSoDienBanDau());
                chiSo.put("nuoc", hd.get().getChiSoNuocBanDau());
            } else {
                // 3. Nếu chưa có hợp đồng nào (có thể là hoá đơn nhanh), đọc chỉ số sẵn có của phòng
                Optional<Phong> p = phongRepository.findById(phongId);
                if (p.isPresent() && p.get().getChiSoDien() != null && p.get().getChiSoNuoc() != null) {
                    chiSo.put("dien", p.get().getChiSoDien());
                    chiSo.put("nuoc", p.get().getChiSoNuoc());
                } else {
                    chiSo.put("dien", 0.0);
                    chiSo.put("nuoc", 0.0);
                }
            }
        }
        return chiSo;
    }

    public BigDecimal getDoanhThuThang(Integer thang, Integer nam) {
        return hoaDonRepository.doanhThuThang(thang, nam);
    }

    public BigDecimal getDoanhThuNam(Integer nam) {
        return hoaDonRepository.doanhThuNam(nam);
    }

    public long countChuaThanhToan() {
        return hoaDonRepository.demHoaDonChuaThanhToan();
    }

    public List<Object[]> getDoanhThuTheoThang(Integer nam) {
        return hoaDonRepository.doanhThuTheoThangTrongNam(nam);
    }
}
