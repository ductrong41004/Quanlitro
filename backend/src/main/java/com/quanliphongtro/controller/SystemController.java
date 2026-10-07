package com.quanliphongtro.controller;

import com.quanliphongtro.service.DatabaseBackupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/system")
@CrossOrigin(origins = "*")
public class SystemController {

    @Autowired
    private DatabaseBackupService databaseBackupService;

    /**
     * Trigger backup database - gọi trước khi tắt server
     */
    @PostMapping("/backup")
    public ResponseEntity<String> triggerBackup() {
        databaseBackupService.onShutdown();
        return ResponseEntity.ok("Backup hoàn tất!");
    }

    /**
     * Trigger restore database - đọc file backup.sql và import vào DB
     * Gọi từ nút "ADD DU LIEU" trong KhoiDong.exe
     */
    @PostMapping("/restore")
    public ResponseEntity<String> triggerRestore() {
        databaseBackupService.triggerRestore();
        return ResponseEntity.ok("Restore hoàn tất!");
    }
}
