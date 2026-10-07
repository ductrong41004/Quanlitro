package com.quanliphongtro.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "hop_dong")
public class HopDong {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "phong_id", nullable = false)
    private Phong phong;

    // Giữ lại cột cũ để MySQL không báo lỗi 'doesn't have a default value'
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "khach_thue_id")
    private KhachThue khachThue;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "hop_dong_khach_thue",
        joinColumns = @JoinColumn(name = "hop_dong_id"),
        inverseJoinColumns = @JoinColumn(name = "khach_thue_id")
    )
    private List<KhachThue> khachThues;

    @Column(name = "ngay_bat_dau", nullable = false)
    private LocalDate ngayBatDau;

    @Column(name = "ngay_ket_thuc")
    private LocalDate ngayKetThuc;

    @Column(name = "ngay_ket_thuc_thuc_te")
    private LocalDate ngayKetThucThucTe;

    @Column(name = "gia_thue_hop_dong", nullable = false, precision = 15, scale = 2)
    private BigDecimal giaThueHopDong;

    @Column(name = "tien_coc", precision = 15, scale = 2)
    private BigDecimal tienCoc = BigDecimal.ZERO;

    @Column(name = "chi_so_dien_ban_dau")
    private Double chiSoDienBanDau = 0.0;

    @Column(name = "chi_so_nuoc_ban_dau")
    private Double chiSoNuocBanDau = 0.0;

    @Column(name = "ngay_tra_tien")
    private Integer ngayTraTien = 5;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false)
    private TrangThaiHopDong trangThai = TrangThaiHopDong.DANG_HIEU_LUC;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    @Column(name = "ngay_tao")
    private LocalDateTime ngayTao;

    @Column(name = "ngay_cap_nhat")
    private LocalDateTime ngayCapNhat;

    public HopDong() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Phong getPhong() { return phong; }
    public void setPhong(Phong phong) { this.phong = phong; }
    public List<KhachThue> getKhachThues() { return khachThues; }
    public void setKhachThues(List<KhachThue> khachThues) { this.khachThues = khachThues; }
    public KhachThue getKhachThue() { return khachThue; }
    public void setKhachThue(KhachThue khachThue) { this.khachThue = khachThue; }
    public LocalDate getNgayBatDau() { return ngayBatDau; }
    public void setNgayBatDau(LocalDate ngayBatDau) { this.ngayBatDau = ngayBatDau; }
    public LocalDate getNgayKetThuc() { return ngayKetThuc; }
    public void setNgayKetThuc(LocalDate ngayKetThuc) { this.ngayKetThuc = ngayKetThuc; }
    public LocalDate getNgayKetThucThucTe() { return ngayKetThucThucTe; }
    public void setNgayKetThucThucTe(LocalDate ngayKetThucThucTe) { this.ngayKetThucThucTe = ngayKetThucThucTe; }
    public BigDecimal getGiaThueHopDong() { return giaThueHopDong; }
    public void setGiaThueHopDong(BigDecimal giaThueHopDong) { this.giaThueHopDong = giaThueHopDong; }
    public BigDecimal getTienCoc() { return tienCoc; }
    public void setTienCoc(BigDecimal tienCoc) { this.tienCoc = tienCoc; }
    public Double getChiSoDienBanDau() { return chiSoDienBanDau; }
    public void setChiSoDienBanDau(Double chiSoDienBanDau) { this.chiSoDienBanDau = chiSoDienBanDau; }
    public Double getChiSoNuocBanDau() { return chiSoNuocBanDau; }
    public void setChiSoNuocBanDau(Double chiSoNuocBanDau) { this.chiSoNuocBanDau = chiSoNuocBanDau; }
    public Integer getNgayTraTien() { return ngayTraTien; }
    public void setNgayTraTien(Integer ngayTraTien) { this.ngayTraTien = ngayTraTien; }
    public TrangThaiHopDong getTrangThai() { return trangThai; }
    public void setTrangThai(TrangThaiHopDong trangThai) { this.trangThai = trangThai; }
    public String getGhiChu() { return ghiChu; }
    public void setGhiChu(String ghiChu) { this.ghiChu = ghiChu; }
    public LocalDateTime getNgayTao() { return ngayTao; }
    public void setNgayTao(LocalDateTime ngayTao) { this.ngayTao = ngayTao; }
    public LocalDateTime getNgayCapNhat() { return ngayCapNhat; }
    public void setNgayCapNhat(LocalDateTime ngayCapNhat) { this.ngayCapNhat = ngayCapNhat; }

    @PrePersist
    protected void onCreate() {
        ngayTao = LocalDateTime.now();
        ngayCapNhat = LocalDateTime.now();
        if (khachThues != null && !khachThues.isEmpty()) {
            this.khachThue = khachThues.get(0);
        }
    }

    @PreUpdate
    protected void onUpdate() {
        ngayCapNhat = LocalDateTime.now();
        if (khachThues != null && !khachThues.isEmpty()) {
            this.khachThue = khachThues.get(0);
        }
    }

    public enum TrangThaiHopDong { DANG_HIEU_LUC, DA_KET_THUC, DA_HUY }
}
