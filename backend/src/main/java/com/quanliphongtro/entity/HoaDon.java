package com.quanliphongtro.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "hoa_don")
public class HoaDon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "phong_id", nullable = false)
    private Phong phong;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "khach_thue_id")
    private KhachThue khachThue;

    @Column(name = "thang", nullable = false)
    private Integer thang;

    @Column(name = "nam", nullable = false)
    private Integer nam;

    @Column(name = "chi_so_dien_cu")
    private Double chiSoDienCu = 0.0;

    @Column(name = "chi_so_dien_moi")
    private Double chiSoDienMoi = 0.0;

    @Column(name = "don_gia_dien", precision = 10, scale = 2)
    private BigDecimal donGiaDien = new BigDecimal("3500");

    @Column(name = "chi_so_nuoc_cu")
    private Double chiSoNuocCu = 0.0;

    @Column(name = "chi_so_nuoc_moi")
    private Double chiSoNuocMoi = 0.0;

    @Column(name = "don_gia_nuoc", precision = 10, scale = 2)
    private BigDecimal donGiaNuoc = new BigDecimal("15000");

    @Column(name = "tien_phong", nullable = false, precision = 15, scale = 2)
    private BigDecimal tienPhong = BigDecimal.ZERO;

    @Column(name = "phi_internet", precision = 10, scale = 2)
    private BigDecimal phiInternet = BigDecimal.ZERO;

    @Column(name = "phi_rac", precision = 10, scale = 2)
    private BigDecimal phiRac = BigDecimal.ZERO;

    @Column(name = "phi_gui_xe", precision = 10, scale = 2)
    private BigDecimal phiGuiXe = BigDecimal.ZERO;

    @Column(name = "phi_khac", precision = 10, scale = 2)
    private BigDecimal phiKhac = BigDecimal.ZERO;

    @Column(name = "ghi_chu_phi_khac", length = 200)
    private String ghiChuPhiKhac;

    @Column(name = "giam_gia", precision = 15, scale = 2)
    private BigDecimal giamGia = BigDecimal.ZERO;

    @Column(name = "ghi_chu_giam_gia", length = 200)
    private String ghiChuGiamGia;

    @Column(name = "tong_tien", precision = 15, scale = 2)
    private BigDecimal tongTien = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false)
    private TrangThaiHoaDon trangThai = TrangThaiHoaDon.CHUA_THANH_TOAN;

    @Column(name = "ngay_thanh_toan")
    private LocalDate ngayThanhToan;

    @Column(name = "phuong_thuc_thanh_toan", length = 50)
    private String phuongThucThanhToan;

    @Column(name = "tu_ngay")
    private LocalDate tuNgay;

    @Column(name = "den_ngay")
    private LocalDate denNgay;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    @Column(name = "ngay_tao")
    private LocalDateTime ngayTao;

    @Column(name = "ngay_cap_nhat")
    private LocalDateTime ngayCapNhat;

    public HoaDon() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Phong getPhong() { return phong; }
    public void setPhong(Phong phong) { this.phong = phong; }
    public KhachThue getKhachThue() { return khachThue; }
    public void setKhachThue(KhachThue khachThue) { this.khachThue = khachThue; }
    public Integer getThang() { return thang; }
    public void setThang(Integer thang) { this.thang = thang; }
    public Integer getNam() { return nam; }
    public void setNam(Integer nam) { this.nam = nam; }
    public Double getChiSoDienCu() { return chiSoDienCu; }
    public void setChiSoDienCu(Double chiSoDienCu) { this.chiSoDienCu = chiSoDienCu; }
    public Double getChiSoDienMoi() { return chiSoDienMoi; }
    public void setChiSoDienMoi(Double chiSoDienMoi) { this.chiSoDienMoi = chiSoDienMoi; }
    public BigDecimal getDonGiaDien() { return donGiaDien; }
    public void setDonGiaDien(BigDecimal donGiaDien) { this.donGiaDien = donGiaDien; }
    public Double getChiSoNuocCu() { return chiSoNuocCu; }
    public void setChiSoNuocCu(Double chiSoNuocCu) { this.chiSoNuocCu = chiSoNuocCu; }
    public Double getChiSoNuocMoi() { return chiSoNuocMoi; }
    public void setChiSoNuocMoi(Double chiSoNuocMoi) { this.chiSoNuocMoi = chiSoNuocMoi; }
    public BigDecimal getDonGiaNuoc() { return donGiaNuoc; }
    public void setDonGiaNuoc(BigDecimal donGiaNuoc) { this.donGiaNuoc = donGiaNuoc; }
    public BigDecimal getTienPhong() { return tienPhong; }
    public void setTienPhong(BigDecimal tienPhong) { this.tienPhong = tienPhong; }
    public BigDecimal getPhiInternet() { return phiInternet; }
    public void setPhiInternet(BigDecimal phiInternet) { this.phiInternet = phiInternet; }
    public BigDecimal getPhiRac() { return phiRac; }
    public void setPhiRac(BigDecimal phiRac) { this.phiRac = phiRac; }
    public BigDecimal getPhiGuiXe() { return phiGuiXe; }
    public void setPhiGuiXe(BigDecimal phiGuiXe) { this.phiGuiXe = phiGuiXe; }
    public BigDecimal getPhiKhac() { return phiKhac; }
    public void setPhiKhac(BigDecimal phiKhac) { this.phiKhac = phiKhac; }
    public String getGhiChuPhiKhac() { return ghiChuPhiKhac; }
    public void setGhiChuPhiKhac(String ghiChuPhiKhac) { this.ghiChuPhiKhac = ghiChuPhiKhac; }
    public BigDecimal getGiamGia() { return giamGia; }
    public void setGiamGia(BigDecimal giamGia) { this.giamGia = giamGia != null ? giamGia : BigDecimal.ZERO; }
    public String getGhiChuGiamGia() { return ghiChuGiamGia; }
    public void setGhiChuGiamGia(String ghiChuGiamGia) { this.ghiChuGiamGia = ghiChuGiamGia; }
    public BigDecimal getTongTien() { return tongTien; }
    public void setTongTien(BigDecimal tongTien) { this.tongTien = tongTien; }
    public TrangThaiHoaDon getTrangThai() { return trangThai; }
    public void setTrangThai(TrangThaiHoaDon trangThai) { this.trangThai = trangThai; }
    public LocalDate getNgayThanhToan() { return ngayThanhToan; }
    public void setNgayThanhToan(LocalDate ngayThanhToan) { this.ngayThanhToan = ngayThanhToan; }
    public String getPhuongThucThanhToan() { return phuongThucThanhToan; }
    public void setPhuongThucThanhToan(String phuongThucThanhToan) { this.phuongThucThanhToan = phuongThucThanhToan; }
    public LocalDate getTuNgay() { return tuNgay; }
    public void setTuNgay(LocalDate tuNgay) { this.tuNgay = tuNgay; }
    public LocalDate getDenNgay() { return denNgay; }
    public void setDenNgay(LocalDate denNgay) { this.denNgay = denNgay; }
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
        tinhTongTien();
    }

    @PreUpdate
    protected void onUpdate() {
        ngayCapNhat = LocalDateTime.now();
        tinhTongTien();
    }

    public void tinhTongTien() {
        BigDecimal tienDien = BigDecimal.valueOf(Math.max(0, chiSoDienMoi - chiSoDienCu)).multiply(donGiaDien);
        BigDecimal tienNuoc = BigDecimal.valueOf(Math.max(0, chiSoNuocMoi - chiSoNuocCu)).multiply(donGiaNuoc);
        BigDecimal giam = giamGia != null ? giamGia : BigDecimal.ZERO;
        tongTien = tienPhong
                .add(tienDien)
                .add(tienNuoc)
                .add(phiInternet)
                .add(phiRac)
                .add(phiGuiXe)
                .add(phiKhac)
                .subtract(giam)
                .max(BigDecimal.ZERO);
    }

    public enum TrangThaiHoaDon { CHUA_THANH_TOAN, DA_THANH_TOAN }
}
