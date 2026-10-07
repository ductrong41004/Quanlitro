package com.quanliphongtro.service;

import com.quanliphongtro.repository.PhongRepository;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

@Service
public class DatabaseBackupService {

    private static final Logger log = LoggerFactory.getLogger(DatabaseBackupService.class);

    @Value("${spring.datasource.username:root}")
    private String username;

    @Value("${spring.datasource.password:}")
    private String password;

    @Value("${app.backup.enabled:true}")
    private boolean backupEnabled;

    @Value("${app.backup.path:D:/Quanliphongtro/database/backup.sql}")
    private String backupPath;
    
    // Hardcode db info or parse from URL. Database name is quanliphongtro
    private String databaseName = "quanliphongtro";
    private String host = "localhost";
    private String port = "3306";

    @Autowired
    private PhongRepository phongRepository;

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        if (!backupEnabled) return;
        
        try {
            File backupFile = new File(backupPath);
            if (!backupFile.exists()) {
                log.info("Không tìm thấy file backup tại {}, bỏ qua bước khôi phục.", backupPath);
                return;
            }

            // Kiểm tra xem DB có rỗng không, nếu rỗng (chưa có phòng nào) thì import
            long count = 0;
            try {
                count = phongRepository.count();
            } catch (Exception e) {
                log.warn("Lỗi khi đếm số lượng phòng, có thể bảng chưa được tạo: {}", e.getMessage());
            }

            if (count == 0) {
                log.info("Database rỗng (0 phòng), tiến hành import từ {}", backupPath);
                restoreDatabase();
            } else {
                log.info("Database đã có dữ liệu ({} phòng), bỏ qua import.", count);
            }
        } catch (Exception e) {
            log.error("Lỗi khi kiểm tra hoặc restore database: ", e);
        }
    }

    @PreDestroy
    public void onShutdown() {
        if (!backupEnabled) return;
        
        log.info("Ứng dụng đang tắt, tiến hành tạo file backup database...");
        backupDatabase();
    }

    /**
     * Trigger restore thủ công - gọi bởi SystemController qua REST API
     * Import toàn bộ dữ liệu từ file backup.sql vào database
     */
    public void triggerRestore() {
        File backupFile = new File(backupPath);
        if (!backupFile.exists()) {
            log.error("Không tìm thấy file backup tại: {}", backupPath);
            return;
        }
        log.info("Bắt đầu restore thủ công từ: {}", backupPath);
        restoreDatabase();
        log.info("Restore thủ công hoàn tất!");
    }

    private void backupDatabase() {
        try {
            File targetFile = new File(backupPath);
            targetFile.getParentFile().mkdirs();

            String mysqldumpPath = findExecutable("mysqldump");
            if (mysqldumpPath == null) {
                log.error("Không tìm thấy mysqldump. Vui lòng kiểm tra Laragon hoặc biến PATH.");
                return;
            }

            List<String> command = new ArrayList<>();
            command.add(mysqldumpPath);
            command.add("-h" + host);
            command.add("-P" + port);
            command.add("-u" + username);
            if (password != null && !password.isEmpty()) {
                command.add("-p" + password);
            }
            command.add("--add-drop-table"); // DROP table trước khi create
            command.add("--routines"); // Export cả stored procedures / functions nếu có
            command.add("-r"); // file output
            command.add(targetFile.getAbsolutePath());
            command.add(databaseName);

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            Process process = pb.start();
            
            int exitCode = process.waitFor();
            if (exitCode == 0) {
                log.info("Backup database thành công tại: {}", targetFile.getAbsolutePath());
            } else {
                log.error("Backup database thất bại. Exit code: {}", exitCode);
            }
        } catch (Exception e) {
            log.error("Lỗi khi backup database: ", e);
        }
    }

    private void restoreDatabase() {
         try {
            String mysqlPath = findExecutable("mysql");
            if (mysqlPath == null) {
                log.error("Không tìm thấy mysql. Vui lòng kiểm tra Laragon hoặc biến PATH.");
                return;
            }

            List<String> command = new ArrayList<>();
            command.add(mysqlPath);
            command.add("-h" + host);
            command.add("-P" + port);
            command.add("-u" + username);
            if (password != null && !password.isEmpty()) {
                command.add("-p" + password);
            }
            command.add("-e");
            command.add("source " + new File(backupPath).getAbsolutePath().replace("\\", "/"));
            command.add(databaseName);

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            Process process = pb.start();
            
            int exitCode = process.waitFor();
            if (exitCode == 0) {
                log.info("Restore database thành công từ: {}", backupPath);
            } else {
                log.error("Restore database thất bại. Exit code: {}", exitCode);
            }
        } catch (Exception e) {
             log.error("Lỗi khi restore database: ", e);
        }
    }

    private String findExecutable(String name) {
        String ext = System.getProperty("os.name").toLowerCase().contains("win") ? ".exe" : "";
        String exeName = name + ext;

        // Tìm kiếm động trong thư mục cài đặt Laragon 
        String[] baseDirs = {"C:\\laragon\\bin\\mysql", "D:\\laragon\\bin\\mysql"};
        for (String base : baseDirs) {
            File baseDir = new File(base);
            if (baseDir.exists() && baseDir.isDirectory()) {
                File[] versionDirs = baseDir.listFiles();
                if (versionDirs != null) {
                    for (File vDir : versionDirs) {
                        if (vDir.isDirectory()) {
                            File exeFile = new File(new File(vDir, "bin"), exeName);
                            if (exeFile.exists()) {
                                return exeFile.getAbsolutePath();
                            }
                        }
                    }
                }
            }
        }

        // Kiểm tra trong PATH
        String defaultMysqlDir = findInPath(exeName);
        if (defaultMysqlDir != null) return defaultMysqlDir;

        // Nếu không tìm thấy, trả về tên cơ bản để hệ thống tự tìm bằng PATH environment 
        return exeName; 
    }

    private String findInPath(String executable) {
        String pathEnv = System.getenv("PATH");
        if (pathEnv != null) {
            String[] paths = pathEnv.split(File.pathSeparator);
            for (String p : paths) {
                File file = new File(p, executable);
                if (file.exists() && file.isFile()) {
                    return file.getAbsolutePath();
                }
            }
        }
        return null;
    }
}
