package com.quanliphongtro.controller;

import com.quanliphongtro.dto.ApiResponse;
import com.quanliphongtro.entity.HoaDon;
import com.quanliphongtro.service.HoaDonService;
 
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hoa-don")
public class HoaDonController {

    private final HoaDonService hoaDonService;

    public HoaDonController(HoaDonService hoaDonService) {
        this.hoaDonService = hoaDonService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<HoaDon>>> getAll(
            @RequestParam(required = false) Long phongId,
            @RequestParam(required = false) Integer thang,
            @RequestParam(required = false) Integer nam,
            @RequestParam(required = false) String trangThai) {
        List<HoaDon> list;
        if (phongId != null) {
            list = hoaDonService.getHoaDonByPhong(phongId);
        } else if (thang != null && nam != null) {
            list = hoaDonService.getHoaDonByThangNam(thang, nam);
        } else {
            list = hoaDonService.getAllHoaDon();
        }
        
        if (trangThai != null && !trangThai.isEmpty()) {
            list = list.stream()
                    .filter(hd -> trangThai.equals(hd.getTrangThai().name()))
                    .toList();
        }
        
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<HoaDon>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(hoaDonService.getHoaDonById(id)));
    }

    @GetMapping("/chi-so-cu")
    public ResponseEntity<ApiResponse<Map<String, Double>>> getChiSoCu(@RequestParam Long phongId) {
        return ResponseEntity.ok(ApiResponse.ok(hoaDonService.getChiSoCu(phongId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<HoaDon>> create(@RequestBody HoaDon hoaDon) {
        try {
            HoaDon created = hoaDonService.createHoaDon(hoaDon);
            return ResponseEntity.ok(ApiResponse.ok("Tạo hóa đơn thành công!", created));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<HoaDon>> update(@PathVariable Long id, @RequestBody HoaDon hoaDon) {
        try {
            HoaDon updated = hoaDonService.updateHoaDon(id, hoaDon);
            return ResponseEntity.ok(ApiResponse.ok("Cập nhật hóa đơn thành công!", updated));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/thanh-toan")
    public ResponseEntity<ApiResponse<HoaDon>> thanhToan(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        try {
            String phuongThuc = body != null ? body.get("phuongThuc") : "Tiền mặt";
            HoaDon hoaDon = hoaDonService.thanhToan(id, phuongThuc);
            return ResponseEntity.ok(ApiResponse.ok("Thanh toán thành công!", hoaDon));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/ky-tinh-tien")
    public ResponseEntity<ApiResponse<HoaDon>> updateKyTinhTien(
            @PathVariable Long id,
            @RequestBody HoaDon request) {
        try {
            HoaDon updated = hoaDonService.updateKyTinhTien(id, request.getTuNgay(), request.getDenNgay());
            return ResponseEntity.ok(ApiResponse.ok("Cập nhật kỳ tính tiền thành công!", updated));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        try {
            hoaDonService.deleteHoaDon(id);
            return ResponseEntity.ok(ApiResponse.ok("Xóa hóa đơn thành công!", null));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/tat-ca")
    public ResponseEntity<ApiResponse<Void>> deleteAll() {
        try {
            hoaDonService.deleteAllHoaDon();
            return ResponseEntity.ok(ApiResponse.ok("Xóa toàn bộ hóa đơn thành công!", null));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
