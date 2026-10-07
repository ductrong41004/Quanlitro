package com.quanliphongtro.dto;

import java.math.BigDecimal;
import java.util.List;

public class DashboardDTO {
    private long tongSoPhong;
    private long soPhongTrong;
    private long soPhongDaThue;
    private long soPhongDangSua;
    private long tongKhachThue;
    private long soHoaDonChuaThanhToan;
    private BigDecimal doanhThuThang;
    private BigDecimal doanhThuNam;
    private List<HopDongSapHetHanDTO> hopDongSapHetHan;
    private List<DoanhThuThangDTO> bieuDoDoanhThu;

    public DashboardDTO() {}

    public long getTongSoPhong() { return tongSoPhong; }
    public void setTongSoPhong(long tongSoPhong) { this.tongSoPhong = tongSoPhong; }
    public long getSoPhongTrong() { return soPhongTrong; }
    public void setSoPhongTrong(long soPhongTrong) { this.soPhongTrong = soPhongTrong; }
    public long getSoPhongDaThue() { return soPhongDaThue; }
    public void setSoPhongDaThue(long soPhongDaThue) { this.soPhongDaThue = soPhongDaThue; }
    public long getSoPhongDangSua() { return soPhongDangSua; }
    public void setSoPhongDangSua(long soPhongDangSua) { this.soPhongDangSua = soPhongDangSua; }
    public long getTongKhachThue() { return tongKhachThue; }
    public void setTongKhachThue(long tongKhachThue) { this.tongKhachThue = tongKhachThue; }
    public long getSoHoaDonChuaThanhToan() { return soHoaDonChuaThanhToan; }
    public void setSoHoaDonChuaThanhToan(long soHoaDonChuaThanhToan) { this.soHoaDonChuaThanhToan = soHoaDonChuaThanhToan; }
    public BigDecimal getDoanhThuThang() { return doanhThuThang; }
    public void setDoanhThuThang(BigDecimal doanhThuThang) { this.doanhThuThang = doanhThuThang; }
    public BigDecimal getDoanhThuNam() { return doanhThuNam; }
    public void setDoanhThuNam(BigDecimal doanhThuNam) { this.doanhThuNam = doanhThuNam; }
    public List<HopDongSapHetHanDTO> getHopDongSapHetHan() { return hopDongSapHetHan; }
    public void setHopDongSapHetHan(List<HopDongSapHetHanDTO> hopDongSapHetHan) { this.hopDongSapHetHan = hopDongSapHetHan; }
    public List<DoanhThuThangDTO> getBieuDoDoanhThu() { return bieuDoDoanhThu; }
    public void setBieuDoDoanhThu(List<DoanhThuThangDTO> bieuDoDoanhThu) { this.bieuDoDoanhThu = bieuDoDoanhThu; }

    public static class HopDongSapHetHanDTO {
        private Long hopDongId;
        private String soPhong;
        private String tenKhach;
        private String soDienThoai;
        private String ngayKetThuc;
        private long soNgayConLai;

        public HopDongSapHetHanDTO() {}
        public HopDongSapHetHanDTO(Long hopDongId, String soPhong, String tenKhach, String soDienThoai, String ngayKetThuc, long soNgayConLai) {
            this.hopDongId = hopDongId;
            this.soPhong = soPhong;
            this.tenKhach = tenKhach;
            this.soDienThoai = soDienThoai;
            this.ngayKetThuc = ngayKetThuc;
            this.soNgayConLai = soNgayConLai;
        }

        public Long getHopDongId() { return hopDongId; }
        public void setHopDongId(Long hopDongId) { this.hopDongId = hopDongId; }
        public String getSoPhong() { return soPhong; }
        public void setSoPhong(String soPhong) { this.soPhong = soPhong; }
        public String getTenKhach() { return tenKhach; }
        public void setTenKhach(String tenKhach) { this.tenKhach = tenKhach; }
        public String getSoDienThoai() { return soDienThoai; }
        public void setSoDienThoai(String soDienThoai) { this.soDienThoai = soDienThoai; }
        public String getNgayKetThuc() { return ngayKetThuc; }
        public void setNgayKetThuc(String ngayKetThuc) { this.ngayKetThuc = ngayKetThuc; }
        public long getSoNgayConLai() { return soNgayConLai; }
        public void setSoNgayConLai(long soNgayConLai) { this.soNgayConLai = soNgayConLai; }
    }

    public static class DoanhThuThangDTO {
        private int thang;
        private BigDecimal doanhThu;

        public DoanhThuThangDTO() {}
        public DoanhThuThangDTO(int thang, BigDecimal doanhThu) {
            this.thang = thang;
            this.doanhThu = doanhThu;
        }

        public int getThang() { return thang; }
        public void setThang(int thang) { this.thang = thang; }
        public BigDecimal getDoanhThu() { return doanhThu; }
        public void setDoanhThu(BigDecimal doanhThu) { this.doanhThu = doanhThu; }
    }
}
