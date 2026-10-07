package com.quanliphongtro.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "phong", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"so_phong", "khu_vuc"})
})
public class Phong {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "so_phong", nullable = false, length = 20)
    private String soPhong;

    @Column(name = "khu_vuc", length = 50)
    private String khuVuc;

    @Column(name = "dien_tich")
    private Double dienTich;

    @Column(name = "gia_thue", nullable = false, precision = 15, scale = 2)
    private BigDecimal giaThue;

    @Column(name = "mo_ta", columnDefinition = "TEXT")
    private String moTa;

    @Column(name = "chi_so_dien")
    private Double chiSoDien = 0.0;

    @Column(name = "chi_so_nuoc")
    private Double chiSoNuoc = 0.0;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false)
    private TrangThaiPhong trangThai = TrangThaiPhong.TRONG;

    @Column(name = "ngay_tao")
    private LocalDateTime ngayTao;

    @Column(name = "ngay_cap_nhat")
    private LocalDateTime ngayCapNhat;

    public Phong() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSoPhong() { return soPhong; }
    public void setSoPhong(String soPhong) { this.soPhong = soPhong; }
    public String getKhuVuc() { return khuVuc; }
    public void setKhuVuc(String khuVuc) { this.khuVuc = khuVuc; }
    public Double getDienTich() { return dienTich; }
    public void setDienTich(Double dienTich) { this.dienTich = dienTich; }
    public BigDecimal getGiaThue() { return giaThue; }
    public void setGiaThue(BigDecimal giaThue) { this.giaThue = giaThue; }
    public String getMoTa() { return moTa; }
    public void setMoTa(String moTa) { this.moTa = moTa; }
    public Double getChiSoDien() { return chiSoDien; }
    public void setChiSoDien(Double chiSoDien) { this.chiSoDien = chiSoDien; }
    public Double getChiSoNuoc() { return chiSoNuoc; }
    public void setChiSoNuoc(Double chiSoNuoc) { this.chiSoNuoc = chiSoNuoc; }
    public TrangThaiPhong getTrangThai() { return trangThai; }
    public void setTrangThai(TrangThaiPhong trangThai) { this.trangThai = trangThai; }
    public LocalDateTime getNgayTao() { return ngayTao; }
    public void setNgayTao(LocalDateTime ngayTao) { this.ngayTao = ngayTao; }
    public LocalDateTime getNgayCapNhat() { return ngayCapNhat; }
    public void setNgayCapNhat(LocalDateTime ngayCapNhat) { this.ngayCapNhat = ngayCapNhat; }

    @PrePersist
    protected void onCreate() {
        ngayTao = LocalDateTime.now();
        ngayCapNhat = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        ngayCapNhat = LocalDateTime.now();
    }

    public enum TrangThaiPhong { TRONG, DA_THUE, DANG_SUA }
}
