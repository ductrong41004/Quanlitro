package com.quanliphongtro.controller;

import com.quanliphongtro.dto.ApiResponse;
import com.quanliphongtro.service.CauHinhService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/cau-hinh")
@CrossOrigin(origins = "*")
public class CauHinhController {

    @Autowired
    private CauHinhService cauHinhService;

    @GetMapping
    public ApiResponse<Map<String, String>> getAllConfigs() {
        Map<String, String> configs = cauHinhService.getAllConfigs();
        return new ApiResponse<>(true, "Lấy cấu hình thành công", configs);
    }

    @PostMapping
    public ApiResponse<String> saveConfigs(@RequestBody Map<String, String> payload) {
        cauHinhService.saveConfigs(payload);
        return new ApiResponse<>(true, "Lưu cấu hình thành công", null);
    }
}
