package com.quanliphongtro.controller;

import com.quanliphongtro.dto.ApiResponse;
import com.quanliphongtro.entity.KhachThue;
import com.quanliphongtro.service.KhachThueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/khach-thue")
public class KhachThueController {

    private final KhachThueService khachThueService;

    public KhachThueController(KhachThueService khachThueService) {
        this.khachThueService = khachThueService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<KhachThue>>> getAll(
            @RequestParam(required = false) String search) {
        List<KhachThue> list;
        if (search != null && !search.isBlank()) {
            list = khachThueService.searchByHoTen(search);
        } else {
            list = khachThueService.getAllKhachThue();
        }
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<KhachThue>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(khachThueService.getKhachThueById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<KhachThue>> create(@RequestBody KhachThue khachThue) {
        try {
            KhachThue created = khachThueService.createKhachThue(khachThue);
            return ResponseEntity.ok(ApiResponse.ok("Thêm khách thuê thành công!", created));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<KhachThue>> update(@PathVariable Long id, @RequestBody KhachThue khachThue) {
        try {
            KhachThue updated = khachThueService.updateKhachThue(id, khachThue);
            return ResponseEntity.ok(ApiResponse.ok("Cập nhật thông tin thành công!", updated));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        try {
            khachThueService.deleteKhachThue(id);
            return ResponseEntity.ok(ApiResponse.ok("Xóa khách thuê thành công!", null));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
