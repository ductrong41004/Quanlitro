package com.quanliphongtro.repository;

import com.quanliphongtro.entity.HopDong;
import com.quanliphongtro.entity.Phong;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface HopDongRepository extends JpaRepository<HopDong, Long> {
    List<HopDong> findByTrangThai(HopDong.TrangThaiHopDong trangThai);
    List<HopDong> findByPhongId(Long phongId);
    List<HopDong> findByKhachThues_Id(Long khachThueId);
    List<HopDong> findByKhachThueId(Long khachThueId);
    Optional<HopDong> findByPhongIdAndTrangThai(Long phongId, HopDong.TrangThaiHopDong trangThai);

    @Query("SELECT h FROM HopDong h WHERE h.trangThai = 'DANG_HIEU_LUC' AND h.ngayKetThuc <= :ngayHetHan")
    List<HopDong> findHopDongSapHetHan(LocalDate ngayHetHan);
}
