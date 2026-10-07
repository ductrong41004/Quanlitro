package com.quanliphongtro.repository;

import com.quanliphongtro.entity.Phong;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PhongRepository extends JpaRepository<Phong, Long> {
    List<Phong> findByTrangThai(Phong.TrangThaiPhong trangThai);
    Optional<Phong> findBySoPhong(String soPhong);
    boolean existsBySoPhong(String soPhong);
    boolean existsBySoPhongAndKhuVuc(String soPhong, String khuVuc);
    long countByTrangThai(Phong.TrangThaiPhong trangThai);
}
