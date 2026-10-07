package com.quanliphongtro.repository;

import com.quanliphongtro.entity.HoaDon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface HoaDonRepository extends JpaRepository<HoaDon, Long> {
    List<HoaDon> findByPhongId(Long phongId);
    List<HoaDon> findByThangAndNam(Integer thang, Integer nam);
    List<HoaDon> findByTrangThai(HoaDon.TrangThaiHoaDon trangThai);
    Optional<HoaDon> findByPhongIdAndThangAndNam(Long phongId, Integer thang, Integer nam);
    Optional<HoaDon> findTopByPhongIdOrderByNamDescThangDesc(Long phongId);
    List<HoaDon> findByKhachThueId(Long khachThueId);

    @Query("SELECT COALESCE(SUM(h.tongTien), 0) FROM HoaDon h WHERE h.thang = :thang AND h.nam = :nam AND h.trangThai = 'DA_THANH_TOAN'")
    BigDecimal doanhThuThang(@Param("thang") Integer thang, @Param("nam") Integer nam);

    @Query("SELECT COUNT(h) FROM HoaDon h WHERE h.trangThai = 'CHUA_THANH_TOAN'")
    long demHoaDonChuaThanhToan();

    @Query("SELECT COALESCE(SUM(h.tongTien), 0) FROM HoaDon h WHERE h.nam = :nam AND h.trangThai = 'DA_THANH_TOAN'")
    BigDecimal doanhThuNam(@Param("nam") Integer nam);

    @Query("SELECT h.thang, COALESCE(SUM(h.tongTien), 0) FROM HoaDon h WHERE h.nam = :nam AND h.trangThai = 'DA_THANH_TOAN' GROUP BY h.thang ORDER BY h.thang")
    List<Object[]> doanhThuTheoThangTrongNam(@Param("nam") Integer nam);
}
