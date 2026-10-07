package com.quanliphongtro.service;

import com.quanliphongtro.entity.KhachThue;
import com.quanliphongtro.entity.HoaDon;
import com.quanliphongtro.entity.HopDong;
import com.quanliphongtro.repository.KhachThueRepository;
import com.quanliphongtro.repository.HoaDonRepository;
import com.quanliphongtro.repository.HopDongRepository;
 
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class KhachThueService {

    private final KhachThueRepository khachThueRepository;
    private final HoaDonRepository hoaDonRepository;
    private final HopDongRepository hopDongRepository;

    public KhachThueService(KhachThueRepository khachThueRepository,
                            HoaDonRepository hoaDonRepository,
                            HopDongRepository hopDongRepository) {
        this.khachThueRepository = khachThueRepository;
        this.hoaDonRepository = hoaDonRepository;
        this.hopDongRepository = hopDongRepository;
    }

    public List<KhachThue> getAllKhachThue() {
        return khachThueRepository.findAll();
    }

    public KhachThue getKhachThueById(Long id) {
        return khachThueRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khách thuê với ID: " + id));
    }

    public List<KhachThue> searchByHoTen(String hoTen) {
        return khachThueRepository.findByHoTenContainingIgnoreCase(hoTen);
    }

    public KhachThue createKhachThue(KhachThue khachThue) {
        // Normalize: chuỗi trống -> null để tránh lỗi unique constraint trong DB
        if (khachThue.getCccd() != null && khachThue.getCccd().isBlank()) {
            khachThue.setCccd(null);
        }
        if (khachThue.getSoDienThoai() != null && khachThue.getSoDienThoai().isBlank()) {
            khachThue.setSoDienThoai(null);
        }
        if (khachThue.getCccd() != null) {
            khachThueRepository.findByCccd(khachThue.getCccd()).ifPresent(k -> {
                throw new RuntimeException("CCCD '" + khachThue.getCccd() + "' đã được đăng ký!");
            });
        }
        return khachThueRepository.save(khachThue);
    }

    public KhachThue updateKhachThue(Long id, KhachThue khachThueDetails) {
        KhachThue khachThue = getKhachThueById(id);
        // Normalize: chuỗi trống -> null
        if (khachThueDetails.getCccd() != null && khachThueDetails.getCccd().isBlank()) {
            khachThueDetails.setCccd(null);
        }
        if (khachThueDetails.getSoDienThoai() != null && khachThueDetails.getSoDienThoai().isBlank()) {
            khachThueDetails.setSoDienThoai(null);
        }
        if (khachThueDetails.getCccd() != null &&
                !khachThueDetails.getCccd().equals(khachThue.getCccd())) {
            khachThueRepository.findByCccd(khachThueDetails.getCccd()).ifPresent(k -> {
                throw new RuntimeException("CCCD '" + khachThueDetails.getCccd() + "' đã được đăng ký!");
            });
        }
        khachThue.setHoTen(khachThueDetails.getHoTen());
        khachThue.setCccd(khachThueDetails.getCccd());
        khachThue.setSoDienThoai(khachThueDetails.getSoDienThoai());
        khachThue.setEmail(khachThueDetails.getEmail());
        khachThue.setDiaChi(khachThueDetails.getDiaChi());
        khachThue.setNgaySinh(khachThueDetails.getNgaySinh());
        khachThue.setGioiTinh(khachThueDetails.getGioiTinh());
        khachThue.setGhiChu(khachThueDetails.getGhiChu());
        return khachThueRepository.save(khachThue);
    }

    public void deleteKhachThue(Long id) {
        KhachThue khachThue = khachThueRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khách thuê với ID: " + id));

        // 1. Gỡ KH khỏi Hợp đồng (Bảng hop_dong & hop_dong_khach_thue)
        List<HopDong> hdsByKhachThueList = hopDongRepository.findByKhachThues_Id(id);
        for (HopDong hd : hdsByKhachThueList) {
            if (hd.getKhachThues().contains(khachThue)) {
                hd.getKhachThues().remove(khachThue);
            }
            hopDongRepository.save(hd);
        }

        List<HopDong> hdsLegacy = hopDongRepository.findByKhachThueId(id);
        for (HopDong hd : hdsLegacy) {
            hd.setKhachThue(null);
            hopDongRepository.save(hd);
        }

        // 2. Gỡ KH khỏi Hóa đơn
        List<HoaDon> hoaDons = hoaDonRepository.findByKhachThueId(id);
        for (HoaDon hd : hoaDons) {
            hd.setKhachThue(null);
            hoaDonRepository.save(hd);
        }

        khachThueRepository.deleteById(id);
    }

    public long countTotal() {
        return khachThueRepository.count();
    }
}
