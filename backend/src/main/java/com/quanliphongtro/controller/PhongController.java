package com.quanliphongtro.controller;

import com.quanliphongtro.dto.ApiResponse;
import com.quanliphongtro.entity.Phong;
import com.quanliphongtro.service.PhongService;
 
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/phong")
public class PhongController {

    private final PhongService phongService;

    public PhongController(PhongService phongService) {
        this.phongService = phongService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Phong>>> getAll(
            @RequestParam(required = false) String trangThai) {
        List<Phong> list;
        if (trangThai != null && !trangThai.isBlank()) {
            list = phongService.getPhongByTrangThai(Phong.TrangThaiPhong.valueOf(trangThai));
        } else {
            list = phongService.getAllPhong();
        }
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Phong>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(phongService.getPhongById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Phong>> create(@RequestBody Phong phong) {
        try {
            Phong created = phongService.createPhong(phong);
            return ResponseEntity.ok(ApiResponse.ok("Tạo phòng thành công!", created));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Phong>> update(@PathVariable Long id, @RequestBody Phong phong) {
        try {
            Phong updated = phongService.updatePhong(id, phong);
            return ResponseEntity.ok(ApiResponse.ok("Cập nhật phòng thành công!", updated));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        try {
            phongService.deletePhong(id);
            return ResponseEntity.ok(ApiResponse.ok("Xóa phòng thành công!", null));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/chi-so")
    public ResponseEntity<ApiResponse<Void>> updateChiSo(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Double> body) {
        try {
            Double dien = body.get("chiSoDien");
            Double nuoc = body.get("chiSoNuoc");
            phongService.updateChiSoDienNuoc(id, dien, nuoc);
            return ResponseEntity.ok(ApiResponse.ok("Cập nhật chỉ số điện/nước thành công!", null));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
