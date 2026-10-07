package com.quanliphongtro.repository;

import com.quanliphongtro.entity.KhachThue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KhachThueRepository extends JpaRepository<KhachThue, Long> {
    Optional<KhachThue> findByCccd(String cccd);
    List<KhachThue> findByHoTenContainingIgnoreCase(String hoTen);
    List<KhachThue> findBySoDienThoaiContaining(String soDienThoai);
}
