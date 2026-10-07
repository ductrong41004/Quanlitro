package com.quanliphongtro.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Cấu hình Spring Boot để phục vụ các file giao diện tĩnh từ thư mục 'frontend'
        // Hỗ trợ cả khi chạy từ thư mục gốc (CWD = c:\Quanliphongtro) 
        // và khi chạy trực tiếp từ thư mục backend (CWD = c:\Quanliphongtro\backend)
        registry.addResourceHandler("/**")
                .addResourceLocations("file:frontend/", "file:../frontend/", "classpath:/static/")
                .setCachePeriod(0); // Tắt cache để cập nhật giao diện lập tức khi chỉnh sửa
    }
}
