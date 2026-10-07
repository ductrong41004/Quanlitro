package com.quanliphongtro.controller;

import com.quanliphongtro.dto.ApiResponse;
import com.quanliphongtro.dto.DashboardDTO;
import com.quanliphongtro.entity.HopDong;
import com.quanliphongtro.service.HoaDonService;
import com.quanliphongtro.service.HopDongService;
import com.quanliphongtro.service.KhachThueService;
import com.quanliphongtro.service.PhongService;
 
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final PhongService phongService;
    private final KhachThueService khachThueService;
    private final HopDongService hopDongService;
    private final HoaDonService hoaDonService;

    public DashboardController(PhongService phongService, KhachThueService khachThueService, HopDongService hopDongService, HoaDonService hoaDonService) {
        this.phongService = phongService;
        this.khachThueService = khachThueService;
        this.hopDongService = hopDongService;
        this.hoaDonService = hoaDonService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<DashboardDTO>> getDashboard() {
        LocalDate now = LocalDate.now();
        int thang = now.getMonthValue();
        int nam = now.getYear();

        // Hợp đồng sắp hết hạn (30 ngày tới)
        List<HopDong> sapHetHan = hopDongService.getHopDongSapHetHan(30);
        List<DashboardDTO.HopDongSapHetHanDTO> sapHetHanDTOs = new ArrayList<>();
        for (HopDong hd : sapHetHan) {
            long soNgay = ChronoUnit.DAYS.between(now, hd.getNgayKetThuc());
            String hoTen = hd.getKhachThues() != null && !hd.getKhachThues().isEmpty() ? hd.getKhachThues().get(0).getHoTen() : "Chưa có khách";
            String sdt = hd.getKhachThues() != null && !hd.getKhachThues().isEmpty() ? hd.getKhachThues().get(0).getSoDienThoai() : "";
            sapHetHanDTOs.add(new DashboardDTO.HopDongSapHetHanDTO(
                    hd.getId(), hd.getPhong().getSoPhong(),
                    hoTen, sdt,
                    hd.getNgayKetThuc().toString(), soNgay
            ));
        }

        // Biểu đồ doanh thu theo tháng trong năm
        List<Object[]> rawDoanhThu = hoaDonService.getDoanhThuTheoThang(nam);
        List<DashboardDTO.DoanhThuThangDTO> bieuDo = new ArrayList<>();
        for (Object[] row : rawDoanhThu) {
            bieuDo.add(new DashboardDTO.DoanhThuThangDTO(
                    ((Number) row[0]).intValue(),
                    (java.math.BigDecimal) row[1]
            ));
        }

        DashboardDTO dto = new DashboardDTO();
        dto.setTongSoPhong(phongService.countTotal());
        dto.setSoPhongTrong(phongService.countByTrangThai(com.quanliphongtro.entity.Phong.TrangThaiPhong.TRONG));
        dto.setSoPhongDaThue(phongService.countByTrangThai(com.quanliphongtro.entity.Phong.TrangThaiPhong.DA_THUE));
        dto.setSoPhongDangSua(phongService.countByTrangThai(com.quanliphongtro.entity.Phong.TrangThaiPhong.DANG_SUA));
        dto.setTongKhachThue(khachThueService.countTotal());
        dto.setSoHoaDonChuaThanhToan(hoaDonService.countChuaThanhToan());
        dto.setDoanhThuThang(hoaDonService.getDoanhThuThang(thang, nam));
        dto.setDoanhThuNam(hoaDonService.getDoanhThuNam(nam));
        dto.setHopDongSapHetHan(sapHetHanDTOs);
        dto.setBieuDoDoanhThu(bieuDo);

        return ResponseEntity.ok(ApiResponse.ok(dto));
    }
}
