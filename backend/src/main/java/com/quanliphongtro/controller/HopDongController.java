package com.quanliphongtro.controller;

import com.quanliphongtro.dto.ApiResponse;
import com.quanliphongtro.entity.HopDong;
import com.quanliphongtro.service.HopDongService;
 
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hop-dong")
public class HopDongController {

    private final HopDongService hopDongService;

    public HopDongController(HopDongService hopDongService) {
        this.hopDongService = hopDongService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<HopDong>>> getAll(
            @RequestParam(required = false) String trangThai,
            @RequestParam(required = false) Long phongId,
            @RequestParam(required = false) Long khachThueId) {
        List<HopDong> list;
        if (phongId != null) {
            list = hopDongService.getHopDongByPhong(phongId);
        } else if (khachThueId != null) {
            list = hopDongService.getHopDongByKhachThue(khachThueId);
        } else if (trangThai != null && !trangThai.isBlank()) {
            list = hopDongService.getHopDongByTrangThai(HopDong.TrangThaiHopDong.valueOf(trangThai));
        } else {
            list = hopDongService.getAllHopDong();
        }
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<HopDong>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(hopDongService.getHopDongById(id)));
    }

    @GetMapping("/sap-het-han")
    public ResponseEntity<ApiResponse<List<HopDong>>> getSapHetHan(
            @RequestParam(defaultValue = "30") int soNgay) {
        return ResponseEntity.ok(ApiResponse.ok(hopDongService.getHopDongSapHetHan(soNgay)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<HopDong>> create(@RequestBody HopDong hopDong) {
        try {
            HopDong created = hopDongService.createHopDong(hopDong);
            return ResponseEntity.ok(ApiResponse.ok("Tạo hợp đồng thành công!", created));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<HopDong>> update(@PathVariable Long id, @RequestBody HopDong hopDong) {
        try {
            HopDong updated = hopDongService.updateHopDong(id, hopDong);
            return ResponseEntity.ok(ApiResponse.ok("Cập nhật hợp đồng thành công!", updated));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/ket-thuc")
    public ResponseEntity<ApiResponse<HopDong>> ketThuc(
            @PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, Object> body) {
        try {
            Double dienMoi = null;
            Double nuocMoi = null;
            if (body != null) {
                if (body.get("chiSoDienMoi") != null)
                    dienMoi = Double.parseDouble(body.get("chiSoDienMoi").toString());
                if (body.get("chiSoNuocMoi") != null)
                    nuocMoi = Double.parseDouble(body.get("chiSoNuocMoi").toString());
            }
            HopDong hopDong = hopDongService.ketThucHopDong(id, dienMoi, nuocMoi);
            return ResponseEntity.ok(ApiResponse.ok("Kết thúc hợp đồng thành công!", hopDong));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        try {
            hopDongService.deleteHopDong(id);
            return ResponseEntity.ok(ApiResponse.ok("Chuyển hợp đồng sang 'Xóa gần đây' thành công!", null));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}/vinh-vien")
    public ResponseEntity<ApiResponse<Void>> deleteVinhVien(@PathVariable Long id) {
        try {
            hopDongService.deleteHopDongVinhVien(id);
            return ResponseEntity.ok(ApiResponse.ok("Xóa vĩnh viễn hợp đồng thành công!", null));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
