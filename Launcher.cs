using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Windows.Forms;

// ══════════════════════════════════════════════════════
//  ModernButton - Nút bấm bo tròn phong cách Guna UI
// ══════════════════════════════════════════════════════
class ModernButton : Control
{
    public string Title { get; set; }
    public string Subtitle { get; set; }
    public Color BaseColor { get; set; }
    public string IconSymbol { get; set; } // "PLAY", "QR", "STOP"

    private bool isHover = false;
    private float hoverProgress = 0f;
    private System.Windows.Forms.Timer timer;

    public ModernButton()
    {
        Title = "BUTTON";
        Subtitle = "Subtext";
        BaseColor = Color.FromArgb(99, 102, 241);
        IconSymbol = "PLAY";

        SetStyle(ControlStyles.AllPaintingInWmPaint |
                 ControlStyles.UserPaint |
                 ControlStyles.OptimizedDoubleBuffer, true);
        this.Cursor = Cursors.Hand;
        timer = new System.Windows.Forms.Timer() { Interval = 16 };
        timer.Tick += (s, e) =>
        {
            if (isHover)
            {
                if (hoverProgress < 1.0f) { hoverProgress += 0.15f; if (hoverProgress > 1.0f) hoverProgress = 1.0f; Invalidate(); }
                else timer.Stop();
            }
            else
            {
                if (hoverProgress > 0f) { hoverProgress -= 0.15f; if (hoverProgress < 0f) hoverProgress = 0f; Invalidate(); }
                else timer.Stop();
            }
        };
    }

    protected override void OnMouseEnter(EventArgs e) { base.OnMouseEnter(e); isHover = true; timer.Start(); }
    protected override void OnMouseLeave(EventArgs e) { base.OnMouseLeave(e); isHover = false; timer.Start(); }

    protected override void OnPaint(PaintEventArgs e)
    {
        e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
        e.Graphics.TextRenderingHint = System.Drawing.Text.TextRenderingHint.ClearTypeGridFit;

        // Vẽ container bo tròn
        Rectangle r = new Rectangle(0, 0, Width - 1, Height - 1);
        GraphicsPath path = MainForm.GetRoundedRectPath(r, 14);

        // Hiệu ứng màu khi hover
        int alpha = (int)(hoverProgress * 30);
        Color hoverBlend = Color.FromArgb(alpha, Color.White);
        Color bg = MainForm.Blend(BaseColor, Color.White, hoverProgress * 0.12f);

        using (SolidBrush br = new SolidBrush(bg))
            e.Graphics.FillPath(br, path);

        // Viền tinh tế
        using (Pen pen = new Pen(Color.FromArgb(40, Color.White), 1f))
            e.Graphics.DrawPath(pen, path);

        if (!Enabled)
        {
            using (SolidBrush brDisabled = new SolidBrush(Color.FromArgb(120, 10, 16, 30)))
                e.Graphics.FillPath(brDisabled, path);
        }

        // Vẽ container chứa icon (hình tròn)
        int iconSize = 44;
        int iconX = 16;
        int iconY = (Height - iconSize) / 2;
        Rectangle iconRect = new Rectangle(iconX, iconY, iconSize, iconSize);

        using (SolidBrush brIconBg = new SolidBrush(Color.FromArgb(40, Color.White)))
            e.Graphics.FillEllipse(brIconBg, iconRect);

        // Vẽ icon dạng vector chống răng cưa cực đẹp
        using (SolidBrush brWhite = new SolidBrush(Enabled ? Color.White : Color.FromArgb(100, Color.White)))
        {
            if (IconSymbol == "PLAY")
            {
                PointF[] points = {
                    new PointF(iconRect.Left + 18, iconRect.Top + 14),
                    new PointF(iconRect.Left + 18, iconRect.Bottom - 14),
                    new PointF(iconRect.Right - 13, iconRect.Top + 22)
                };
                e.Graphics.FillPolygon(brWhite, points);
            }
            else if (IconSymbol == "QR")
            {
                int sz = 7;
                e.Graphics.FillRectangle(brWhite, iconRect.Left + 13, iconRect.Top + 13, sz, sz);
                e.Graphics.FillRectangle(brWhite, iconRect.Right - 13 - sz, iconRect.Top + 13, sz, sz);
                e.Graphics.FillRectangle(brWhite, iconRect.Left + 13, iconRect.Bottom - 13 - sz, sz, sz);
                
                // Mấy chấm nhỏ của QR
                e.Graphics.FillRectangle(brWhite, iconRect.Right - 13 - sz, iconRect.Bottom - 13 - sz, sz, sz);
                e.Graphics.FillRectangle(brWhite, iconRect.Left + 16, iconRect.Top + 16, 1, 1);
                e.Graphics.FillRectangle(brWhite, iconRect.Right - 16, iconRect.Top + 16, 1, 1);
                e.Graphics.FillRectangle(brWhite, iconRect.Left + 16, iconRect.Bottom - 16, 1, 1);
            }
            else if (IconSymbol == "STOP")
            {
                e.Graphics.FillRectangle(brWhite, iconRect.Left + 14, iconRect.Top + 14, 16, 16);
            }
            else if (IconSymbol == "GLOBE")
            {
                int x = iconRect.Left + 13;
                int y = iconRect.Top + 13;
                int w = 18;
                int h = 18;
                using (Pen penWhite = new Pen(Enabled ? Color.White : Color.FromArgb(100, Color.White), 1.5f))
                {
                    e.Graphics.DrawEllipse(penWhite, x, y, w, h);
                    e.Graphics.DrawLine(penWhite, x, y + h / 2, x + w, y + h / 2);
                    e.Graphics.DrawLine(penWhite, x + w / 2, y, x + w / 2, y + h);
                    e.Graphics.DrawEllipse(penWhite, x + 3, y, w - 6, h);
                }
            }
        }

        // Vẽ Text tiêu đề & mô tả phụ
        int textX = iconX + iconSize + 12;
        int textY = (Height - 38) / 2;

        using (Font fontTitle = new Font("Segoe UI", 10f, FontStyle.Bold))
        using (Font fontSub = new Font("Segoe UI", 7.5f))
        using (SolidBrush brTitle = new SolidBrush(Enabled ? Color.White : Color.FromArgb(140, Color.White)))
        using (SolidBrush brSub = new SolidBrush(Enabled ? Color.FromArgb(180, Color.White) : Color.FromArgb(100, Color.White)))
        {
            e.Graphics.DrawString(Title, fontTitle, brTitle, textX, textY);
            
            // Xử lý xuống dòng cho mô tả dài nếu cần
            RectangleF subRect = new RectangleF(textX, textY + 20, Width - textX - 10, 32);
            e.Graphics.DrawString(Subtitle, fontSub, brSub, subRect);
        }
    }
}

// ══════════════════════════════════════════════════════
//  StatusCard - Bảng trạng thái hệ thống bo tròn cực đẹp
// ══════════════════════════════════════════════════════
class StatusCard : Panel
{
    public Image ServerImage { get; set; }
    public string[] Bullets { get; set; }
    public Color[] BulletColors { get; set; }

    public StatusCard()
    {
        Bullets = new string[0];
        BulletColors = new Color[0];

        SetStyle(ControlStyles.AllPaintingInWmPaint |
                 ControlStyles.UserPaint |
                 ControlStyles.OptimizedDoubleBuffer, true);
        BackColor = Color.Transparent;
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
        e.Graphics.TextRenderingHint = System.Drawing.Text.TextRenderingHint.ClearTypeGridFit;

        Rectangle r = new Rectangle(0, 0, Width - 1, Height - 1);
        GraphicsPath path = MainForm.GetRoundedRectPath(r, 16);

        // Vẽ nền Panel (Deep navy / Slate 900)
        using (SolidBrush brBg = new SolidBrush(Color.FromArgb(17, 25, 43)))
            e.Graphics.FillPath(brBg, path);

        // Viền nhạt xung quanh card
        using (Pen penBorder = new Pen(Color.FromArgb(25, 45, 78), 1.2f))
            e.Graphics.DrawPath(penBorder, path);

        // Vẽ dải màu accent bên trái (Violet)
        using (SolidBrush brAccent = new SolidBrush(Color.FromArgb(124, 58, 237)))
            e.Graphics.FillRectangle(brAccent, new Rectangle(0, 24, 4, Height - 48));

        // Tiêu đề "TRẠNG THÁI HỆ THỐNG"
        using (Font fHead = new Font("Segoe UI", 9.5f, FontStyle.Bold))
        using (SolidBrush brHead = new SolidBrush(Color.FromArgb(139, 92, 246)))
            e.Graphics.DrawString("TRẠNG THÁI HỆ THỐNG", fHead, brHead, 24, 20);

        // Vẽ các dòng trạng thái (Bullets)
        using (Font fText = new Font("Segoe UI", 10f))
        using (SolidBrush brText = new SolidBrush(Color.FromArgb(200, 210, 230)))
        {
            for (int i = 0; i < Bullets.Length; i++)
            {
                int y = 56 + i * 36;
                Color bulletColor = i < BulletColors.Length ? BulletColors[i] : Color.FromArgb(16, 185, 129);
                
                // Vẽ dấu chấm tròn trạng thái glowing nhẹ
                using (SolidBrush brBulletGlow = new SolidBrush(Color.FromArgb(40, bulletColor)))
                    e.Graphics.FillEllipse(brBulletGlow, 21, y + 3, 14, 14);
                using (SolidBrush brBullet = new SolidBrush(bulletColor))
                    e.Graphics.FillEllipse(brBullet, 24, y + 6, 8, 8);

                // Vẽ text
                e.Graphics.DrawString(Bullets[i], fText, brText, 42, y);
            }
        }

        // Vẽ hình ảnh Server 3D ở góc phải
        if (ServerImage != null)
        {
            int imgSize = 190;
            int imgX = Width - imgSize - 20;
            int imgY = (Height - imgSize) / 2;
            e.Graphics.DrawImage(ServerImage, new Rectangle(imgX, imgY, imgSize, imgSize));
        }
    }
}

// ══════════════════════════════════════════════════════
//  RoundedProgressBar - Thanh tiến trình bo tròn mượt mà
// ══════════════════════════════════════════════════════
class RoundedProgressBar : Control
{
    private double _cur = 0;
    private int _tgt = 0;
    public Color BarColor { get; set; } // Xanh ngọc lục bảo
    private System.Windows.Forms.Timer _t;

    public int Value
    {
        get { return _tgt; }
        set { _tgt = Math.Max(0, Math.Min(100, value)); if (!_t.Enabled) _t.Start(); }
    }

    public RoundedProgressBar()
    {
        BarColor = Color.FromArgb(16, 185, 129);

        SetStyle(ControlStyles.OptimizedDoubleBuffer |
                 ControlStyles.AllPaintingInWmPaint |
                 ControlStyles.UserPaint, true);
        _t = new System.Windows.Forms.Timer() { Interval = 16 };
        _t.Tick += delegate(object s, EventArgs e)
        {
            double d = _tgt - _cur;
            if (Math.Abs(d) < 0.2) { _cur = _tgt; _t.Stop(); }
            else _cur += d * 0.15;
            Invalidate();
        };
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;

        // Vẽ thanh nền (Track) màu slate đậm
        Rectangle rBg = new Rectangle(0, 0, Width - 1, Height - 1);
        GraphicsPath bgPath = MainForm.GetRoundedRectPath(rBg, Height / 2);
        using (SolidBrush brBg = new SolidBrush(Color.FromArgb(30, 41, 59)))
            e.Graphics.FillPath(brBg, bgPath);

        // Vẽ thanh tiến trình chạy (Bar) bo tròn
        int w = (int)((Width - 1) * _cur / 100.0);
        if (w > Height)
        {
            Rectangle rBar = new Rectangle(0, 0, w, Height - 1);
            GraphicsPath barPath = MainForm.GetRoundedRectPath(rBar, Height / 2);

            Color light = Color.FromArgb(255, Math.Min(255, BarColor.R + 40), Math.Min(255, BarColor.G + 40), Math.Min(255, BarColor.B + 40));
            using (LinearGradientBrush lgb = new LinearGradientBrush(rBar, BarColor, light, LinearGradientMode.Horizontal))
                e.Graphics.FillPath(lgb, barPath);

            // Shimmer lấp lánh nhẹ khi đang chạy
            if (_tgt > 0 && _tgt < 100)
            {
                using (LinearGradientBrush brShim = new LinearGradientBrush(
                    new RectangleF(w - Height * 3, 0, Height * 3, Height),
                    Color.Transparent, Color.FromArgb(60, Color.White),
                    LinearGradientMode.Horizontal))
                    e.Graphics.FillRectangle(brShim, w - Height * 3, 0, Height * 3, Height);
            }
        }
    }
}

// ══════════════════════════════════════════════════════
//  FormNavButton - Nút điều hướng tối giản cho tiêu đề
// ══════════════════════════════════════════════════════
class FormNavButton : Button
{
    public Color HoverColor { get; set; }

    public FormNavButton()
    {
        HoverColor = Color.FromArgb(40, Color.White);

        FlatStyle = FlatStyle.Flat;
        FlatAppearance.BorderSize = 0;
        BackColor = Color.Transparent;
        ForeColor = Color.FromArgb(150, 160, 180);
        Font = new Font("Segoe UI", 9f, FontStyle.Bold);
        Cursor = Cursors.Hand;
        Size = new Size(32, 24);
    }

    protected override void OnMouseEnter(EventArgs e) { base.OnMouseEnter(e); BackColor = HoverColor; ForeColor = Color.White; }
    protected override void OnMouseLeave(EventArgs e) { base.OnMouseLeave(e); BackColor = Color.Transparent; ForeColor = Color.FromArgb(150, 160, 180); }
}

// ══════════════════════════════════════════════════════
//  MainForm - Giao diện chính của Launcher phong cách Guna
// ══════════════════════════════════════════════════════
class MainForm : Form
{
    // Bảng màu tối cao cấp (Slate/Navy)
    static readonly Color C_BG = Color.FromArgb(10, 16, 30);
    static readonly Color C_SURFACE = Color.FromArgb(15, 23, 42);
    static readonly Color C_BORDER = Color.FromArgb(28, 40, 68);
    static readonly Color C_GREEN = Color.FromArgb(16, 185, 129);
    static readonly Color C_RED = Color.FromArgb(239, 68, 68);
    static readonly Color C_BLUE = Color.FromArgb(99, 102, 241);
    static readonly Color C_GOLD = Color.FromArgb(245, 158, 11);
    static readonly Color C_TEXT = Color.FromArgb(241, 245, 249);
    static readonly Color C_DIM = Color.FromArgb(148, 163, 184);
    static readonly Color C_MUTED = Color.FromArgb(71, 85, 105);

    // Kéo thả Form borderless
    private bool dragging = false;
    private Point dragCursorPoint;
    private Point dragFormPoint;

    // Controls
    private Label lblPct;
    private StatusCard cardStatus;
    private Panel pnlStatusPill;
    private Label lblStatusPill;
    private RoundedProgressBar pgBar;
    private ModernButton btnStart, btnQr, btnTunnel, btnStop;
    private System.Windows.Forms.Timer pulseTmr;
    private bool isServerRunning = false;
    private int pulsePhase = 0;
    private Image imgServer = null;

    private static Process serverProc = null;
    private static Process tunnelProc = null;
    private string tunnelUrl = null;
    private BackgroundWorker wStart, wStop;

    [STAThread]
    static void Main()
    {
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Application.Run(new MainForm());
    }

    public MainForm()
    {
        SetStyle(ControlStyles.OptimizedDoubleBuffer |
                 ControlStyles.AllPaintingInWmPaint, true);
        
        AppDomain.CurrentDomain.ProcessExit += delegate(object s, EventArgs e)
        {
            try { if (serverProc != null && !serverProc.HasExited) serverProc.Kill(); } catch { }
            try { if (tunnelProc != null && !tunnelProc.HasExited) tunnelProc.Kill(); } catch { }
        };

        LoadAssets();
        BuildUI();
        WireWorkers();
        
        // Kiểm tra xem server có đang chạy ngầm từ trước không
        if (PortOpen(8080))
        {
            UpdateSystemState(true);
            btnStart.Enabled = false;
            btnQr.Enabled = true;
            btnTunnel.Enabled = true;
            btnStop.Enabled = true;
        }
        else
        {
            UpdateSystemState(false);
        }
    }

    private void LoadAssets()
    {
        try
        {
            string base_ = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\', '/');
            string imgPath = Path.Combine(base_, "frontend", "img", "server_graphic.png");
            if (File.Exists(imgPath))
            {
                imgServer = Image.FromFile(imgPath);
            }
        }
        catch { }
    }

    private void BuildUI()
    {
        this.SuspendLayout();
        this.Text = "Quan Ly Phong Tro - Tin 04";
        this.ClientSize = new Size(800, 560);
        this.BackColor = C_BG;
        this.FormBorderStyle = FormBorderStyle.None; // Không viền Windows cũ kỹ
        this.StartPosition = FormStartPosition.CenterScreen;
        this.Font = new Font("Segoe UI", 9f);

        // Bo tròn Form chính
        this.Load += (s, e) => {
            this.Region = new Region(GetRoundedRectPath(new Rectangle(0, 0, this.Width, this.Height), 22));
        };

        // ── Xử lý kéo thả Form trên Header (Y: 0 đến 80) ──
        this.MouseDown += (s, e) => {
            if (e.Y <= 80 && e.Button == MouseButtons.Left)
            {
                dragging = true;
                dragCursorPoint = Cursor.Position;
                dragFormPoint = this.Location;
            }
        };
        this.MouseMove += (s, e) => {
            if (dragging)
            {
                Point dif = Point.Subtract(Cursor.Position, new Size(dragCursorPoint));
                this.Location = Point.Add(dragFormPoint, new Size(dif));
            }
        };
        this.MouseUp += (s, e) => dragging = false;

        // ── Nút Close & Minimize (Top-Right) ─────────────────
        FormNavButton btnClose = new FormNavButton() {
            Text = "✕",
            Location = new Point(758, 12),
            Size = new Size(30, 30),
            HoverColor = Color.FromArgb(239, 68, 68)
        };
        btnClose.Click += (s, e) => Application.Exit();

        FormNavButton btnMin = new FormNavButton() {
            Text = "—",
            Location = new Point(722, 12),
            Size = new Size(30, 30),
            HoverColor = Color.FromArgb(30, 41, 59)
        };
        btnMin.Click += (s, e) => this.WindowState = FormWindowState.Minimized;

        this.Controls.AddRange(new Control[] { btnClose, btnMin });

        // ── Tiêu đề và Subtitle ─────────────────────────
        Label lblTitle = new Label() {
            Text = "Quản Lý Phòng Trọ",
            Font = new Font("Segoe UI", 16f, FontStyle.Bold),
            ForeColor = Color.White,
            BackColor = Color.Transparent,
            Location = new Point(84, 16),
            Size = new Size(300, 30),
            AutoSize = false
        };

        Label lblSub = new Label() {
            Text = "📅 Tin 04  •  🏠 Hệ thống quản lý nhà trọ",
            Font = new Font("Segoe UI", 9f),
            ForeColor = C_DIM,
            BackColor = Color.Transparent,
            Location = new Point(85, 46),
            Size = new Size(300, 20)
        };

        this.Controls.AddRange(new Control[] { lblTitle, lblSub });

        // ── Status Pill (Top-Right Server status badge) ────────
        pnlStatusPill = new Panel() {
            Size = new Size(220, 34),
            Location = new Point(486, 22),
            BackColor = Color.Transparent
        };
        pnlStatusPill.Paint += DrawStatusPill;

        lblStatusPill = new Label() {
            Text = "Server đang tắt",
            Font = new Font("Segoe UI", 9f, FontStyle.Bold),
            ForeColor = Color.White,
            BackColor = Color.Transparent,
            Dock = DockStyle.Fill,
            TextAlign = ContentAlignment.MiddleCenter
        };
        pnlStatusPill.Controls.Add(lblStatusPill);
        this.Controls.Add(pnlStatusPill);

        // ── Status Card (Khung lớn ở giữa) ────────────────────
        cardStatus = new StatusCard() {
            Location = new Point(24, 85),
            Size = new Size(752, 230),
            ServerImage = imgServer
        };
        this.Controls.Add(cardStatus);

        // ── Tiến Trình (Progress bar area) ────────────────────
        Label lblProgTitle = new Label() {
            Text = "TIẾN TRÌNH",
            Font = new Font("Segoe UI", 8f, FontStyle.Bold),
            ForeColor = C_DIM,
            BackColor = Color.Transparent,
            Location = new Point(24, 335),
            Size = new Size(100, 16)
        };

        pgBar = new RoundedProgressBar() {
            Location = new Point(24, 358),
            Size = new Size(690, 12),
            BarColor = C_BLUE,
            Value = 0
        };

        lblPct = new Label() {
            Text = "0%",
            Font = new Font("Segoe UI", 9.5f, FontStyle.Bold),
            ForeColor = C_DIM,
            BackColor = Color.Transparent,
            Location = new Point(724, 353),
            Size = new Size(52, 22),
            TextAlign = ContentAlignment.MiddleRight
        };

        this.Controls.AddRange(new Control[] { lblProgTitle, pgBar, lblPct });

        // ── Hàng Nút Bấm Modern (Y: 395) — 4 nút, mỗi nút 179px ──
        btnStart = new ModernButton() {
            Title = "BẬT SERVER",
            Subtitle = "Khởi động hệ thống",
            BaseColor = C_GREEN,
            IconSymbol = "PLAY",
            Location = new Point(24, 395),
            Size = new Size(179, 80)
        };
        btnStart.Click += delegate(object s, EventArgs e) { DoStart(); };

        btnQr = new ModernButton() {
            Title = "QR WI-FI",
            Subtitle = "Kết nối điện thoại cùng mạng",
            BaseColor = Color.FromArgb(30, 41, 95),
            IconSymbol = "QR",
            Location = new Point(215, 395),
            Size = new Size(179, 80),
            Enabled = false
        };
        btnQr.Click += delegate(object s, EventArgs e) { DoShowQr(); };

        btnTunnel = new ModernButton() {
            Title = "TUNNEL 4G",
            Subtitle = "Truy cập từ Internet / 4G",
            BaseColor = Color.FromArgb(30, 60, 100),
            IconSymbol = "GLOBE",
            Location = new Point(406, 395),
            Size = new Size(179, 80),
            Enabled = false
        };
        btnTunnel.Click += delegate(object s, EventArgs e) { DoShowTunnel(); };

        btnStop = new ModernButton() {
            Title = "TẮT MÁY TÍNH",
            Subtitle = "Lưu dữ liệu & Tắt PC",
            BaseColor = C_RED,
            IconSymbol = "STOP",
            Location = new Point(597, 395),
            Size = new Size(179, 80),
            Enabled = false
        };
        btnStop.Click += delegate(object s, EventArgs e) { DoStop(); };

        this.Controls.AddRange(new Control[] { btnStart, btnQr, btnTunnel, btnStop });

        // ── Footer Divider ───────────────────────────────────
        Panel pnlFootDiv = new Panel() {
            Location = new Point(0, 505),
            Size = new Size(800, 1),
            BackColor = C_BORDER
        };

        Label lblFoot = new Label() {
            Text = "ⓘ Tin 04  -  Quản Lý Phòng Trọ v1.0  -  Khởi động Laragon trước khi bật server",
            Font = new Font("Segoe UI", 8f),
            ForeColor = C_MUTED,
            BackColor = Color.Transparent,
            Location = new Point(24, 525),
            Size = new Size(600, 18),
            TextAlign = ContentAlignment.MiddleLeft
        };

        Label lblVer = new Label() {
            Text = "v1.0",
            Font = new Font("Segoe UI", 8f),
            ForeColor = C_MUTED,
            BackColor = Color.Transparent,
            Location = new Point(736, 525),
            Size = new Size(40, 18),
            TextAlign = ContentAlignment.MiddleRight
        };

        this.Controls.AddRange(new Control[] { pnlFootDiv, lblFoot, lblVer });

        // ── Nhấp nháy động cho status badge ──────────────────
        pulseTmr = new System.Windows.Forms.Timer();
        pulseTmr.Interval = 700;
        pulseTmr.Tick += delegate(object s, EventArgs e)
        {
            pulsePhase = 1 - pulsePhase;
            lblStatusPill.Text = (pulsePhase == 0 ? "● " : "○ ") + "Server đang hoạt động";
        };

        this.ResumeLayout();
    }

    // Custom drawing vẽ biểu tượng badge "04" ở top-left
    protected override void OnPaint(PaintEventArgs e)
    {
        base.OnPaint(e);
        e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
        e.Graphics.TextRenderingHint = System.Drawing.Text.TextRenderingHint.ClearTypeGridFit;

        // Vẽ viền Form tinh tế
        using (Pen pBorder = new Pen(C_BORDER, 1.5f))
        {
            GraphicsPath fPath = GetRoundedRectPath(new Rectangle(0, 0, Width - 1, Height - 1), 22);
            e.Graphics.DrawPath(pBorder, fPath);
        }

        // Tạo vòng tròn phát sáng gradient gradient chéo xanh-tím
        Rectangle circleRect = new Rectangle(24, 16, 44, 44);
        using (LinearGradientBrush lgb = new LinearGradientBrush(circleRect, Color.FromArgb(139, 92, 246), Color.FromArgb(6, 182, 212), 45f))
        using (Pen pen = new Pen(lgb, 3f))
        {
            e.Graphics.DrawEllipse(pen, circleRect);
        }

        // Vẽ chữ "04" đậm trắng ở trung tâm vòng tròn
        using (Font f = new Font("Segoe UI", 11.5f, FontStyle.Bold))
        using (SolidBrush tb = new SolidBrush(Color.White))
        {
            StringFormat sf = new StringFormat() { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
            e.Graphics.DrawString("04", f, tb, circleRect, sf);
        }
    }

    // Vẽ pill trạng thái server góc phải
    private void DrawStatusPill(object sender, PaintEventArgs e)
    {
        e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
        Rectangle r = new Rectangle(0, 0, pnlStatusPill.Width - 1, pnlStatusPill.Height - 1);
        GraphicsPath pillPath = GetRoundedRectPath(r, r.Height / 2);

        Color pillBorderColor = isServerRunning ? C_GREEN : C_RED;
        Color pillBgColor = isServerRunning ? Color.FromArgb(20, 16, 185, 129) : Color.FromArgb(20, 239, 68, 68);

        using (SolidBrush br = new SolidBrush(pillBgColor))
            e.Graphics.FillPath(br, pillPath);
        using (Pen pen = new Pen(pillBorderColor, 1.5f))
            e.Graphics.DrawPath(pen, pillPath);
    }

    private void UpdateSystemState(bool running)
    {
        isServerRunning = running;
        pnlStatusPill.Invalidate();

        if (running)
        {
            lblStatusPill.Text = "● Server đang hoạt động";
            pulseTmr.Start();
            
            // Cập nhật Bullets Card hoạt động
            cardStatus.Bullets = new string[] {
                "Server đang chạy ổn định qua địa chỉ mạng.",
                "Hệ thống đã phục vụ giao diện tĩnh và API đồng bộ.",
                "Nhấn 'TẮT MÁY TÍNH' để lưu dữ liệu và tắt nguồn máy tính."
            };
            cardStatus.BulletColors = new Color[] { C_GREEN, C_BLUE, C_GOLD };
        }
        else
        {
            pulseTmr.Stop();
            lblStatusPill.Text = "● Server đang tắt";
            
            // Cập nhật Bullets Card lúc tắt
            cardStatus.Bullets = new string[] {
                "Hệ thống máy chủ phòng trọ đang tắt.",
                "Nhấn 'BẬT SERVER' để khởi chạy các cổng quản lý.",
                "Laragon/MySQL cần được khởi động trước khi bật server."
            };
            cardStatus.BulletColors = new Color[] { C_RED, C_BLUE, C_DIM };
        }
        cardStatus.Invalidate();
    }

    // ══════════════════════════════════════════════════
    //  WORKERS & LOGIC
    // ══════════════════════════════════════════════════
    private void WireWorkers()
    {
        wStart = new BackgroundWorker();
        wStart.WorkerReportsProgress = true;
        wStart.DoWork += StartWork;
        wStart.ProgressChanged += OnProg;
        wStart.RunWorkerCompleted += StartDone;

        wStop = new BackgroundWorker();
        wStop.WorkerReportsProgress = true;
        wStop.DoWork += StopWork;
        wStop.ProgressChanged += OnProg;
        wStop.RunWorkerCompleted += StopDone;
    }

    private void OnProg(object s, ProgressChangedEventArgs e)
    {
        pgBar.Value = e.ProgressPercentage;
        lblPct.Text = e.ProgressPercentage + "%";
    }

    private void AllBtns(bool on)
    {
        btnStart.Enabled = on;
        btnQr.Enabled = on && isServerRunning;
        btnTunnel.Enabled = on && isServerRunning;
        btnStop.Enabled = on;
    }

    // ══════════════════════════════════════════════════
    //  BẬT SERVER
    // ══════════════════════════════════════════════════
    private void DoStart()
    {
        AllBtns(false);
        pgBar.BarColor = C_BLUE;
        pgBar.Value = 0;
        wStart.RunWorkerAsync();
    }

    private void StartWork(object sender, DoWorkEventArgs e)
    {
        BackgroundWorker w = (BackgroundWorker)sender;
        string base_ = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\', '/');
        
        w.ReportProgress(10); Thread.Sleep(300);
        string jar = FindJar(base_);
        if (jar == null) { e.Result = "NO_JAR"; return; }
        
        w.ReportProgress(25); Thread.Sleep(300);
        if (!JavaOk()) { e.Result = "NO_JAVA"; return; }
        
        w.ReportProgress(40);
        ProcessStartInfo psi = new ProcessStartInfo();
        psi.FileName = "java"; 
        psi.Arguments = "-Dfile.encoding=UTF-8 -jar \"" + jar + "\"";
        psi.WorkingDirectory = base_; 
        psi.UseShellExecute = false;
        psi.CreateNoWindow = true; 
        psi.WindowStyle = ProcessWindowStyle.Hidden;
        serverProc = Process.Start(psi);
        
        // Đợi cổng 8080 mở trong tối đa 90 giây
        for (int i = 0; i < 90; i++)
        {
            if (PortOpen(8080)) break;
            int p = 40 + (int)((double)i / 90 * 50);
            w.ReportProgress(p);
            Thread.Sleep(1000);
        }
        
        w.ReportProgress(92); Thread.Sleep(300);
        if (!PortOpen(8080)) { e.Result = "TIMEOUT"; return; }
        
        w.ReportProgress(98); Thread.Sleep(300);
        
        // Mở trình duyệt Chrome (nếu có) hoặc mặc định của máy
        OpenUrlInChromeOrDefault("http://localhost:8080/index.html");
        
        w.ReportProgress(100);
        e.Result = "OK";
    }

    private void StartDone(object s, RunWorkerCompletedEventArgs e)
    {
        string r = (string)e.Result;
        if (r == "OK")
        {
            pgBar.BarColor = C_GREEN;
            UpdateSystemState(true);
            btnStart.Enabled = false;
            btnQr.Enabled = true;
            btnTunnel.Enabled = true;
            btnStop.Enabled = true;
        }
        else
        {
            AllBtns(true);
            pgBar.BarColor = C_RED;
            if (r == "NO_JAR") MessageBox.Show("Không tìm thấy file backend JAR trong backend/target!\nVui lòng chạy mvnw.cmd package trong thư mục backend trước.", "Lỗi hệ thống", MessageBoxButtons.OK, MessageBoxIcon.Error);
            else if (r == "NO_JAVA") MessageBox.Show("Máy tính của bạn chưa được cài đặt Java Runtime Environment JDK 17+.", "Lỗi Java", MessageBoxButtons.OK, MessageBoxIcon.Error);
            else MessageBox.Show("Không thể khởi động Server.\nVui lòng khởi động Laragon/MySQL và kiểm tra xem cổng 8080 có bị chiếm dụng không.", "Lỗi kết nối", MessageBoxButtons.OK, MessageBoxIcon.Warning);
        }
    }

    // ══════════════════════════════════════════════════
    //  TẮT SERVER
    // ══════════════════════════════════════════════════
    private void DoStop()
    {
        AllBtns(false);
        pgBar.BarColor = C_RED;
        pgBar.Value = 0;
        wStop.RunWorkerAsync();
    }

    private void StopWork(object sender, DoWorkEventArgs e)
    {
        BackgroundWorker w = (BackgroundWorker)sender;
        w.ReportProgress(20);
        
        // Gọi API backup tự động để lưu database
        try
        {
            HttpWebRequest req = (HttpWebRequest)WebRequest.Create("http://localhost:8080/api/system/backup");
            req.Method = "POST"; 
            req.Timeout = 15000; 
            req.ContentLength = 0;
            using (var resp = req.GetResponse()) { }
        }
        catch { }
        
        w.ReportProgress(60); Thread.Sleep(3000); // Đợi mysqldump ghi xong file sql
        
        w.ReportProgress(80);
        if (serverProc != null && !serverProc.HasExited)
        {
            try { serverProc.Kill(); serverProc.WaitForExit(8000); } catch { }
        }
        serverProc = null;

        if (tunnelProc != null && !tunnelProc.HasExited)
        {
            try { tunnelProc.Kill(); tunnelProc.WaitForExit(3000); } catch { }
        }
        tunnelProc = null;

        // KIỂM TRA & GIẢI PHÓNG CỔNG 8080 (Nếu còn tiến trình java khác chạy ngầm)
        if (PortOpen(8080))
        {
            try
            {
                ProcessStartInfo psiKill = new ProcessStartInfo();
                psiKill.FileName = "powershell.exe";
                psiKill.Arguments = "-NoProfile -Command \"Stop-Process -Id (Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue).OwningProcess -Force\"";
                psiKill.CreateNoWindow = true;
                psiKill.UseShellExecute = false;
                psiKill.WindowStyle = ProcessWindowStyle.Hidden;
                using (Process pKill = Process.Start(psiKill))
                {
                    pKill.WaitForExit(5000);
                }
            }
            catch { }
        }
        w.ReportProgress(95);

        // THỰC THI LỆNH TẮT MÁY TÍNH WINDOWS
        try
        {
            Process.Start("shutdown", "/s /t 5");
        }
        catch { }
        
        w.ReportProgress(100);
        e.Result = "OK";
    }

    private void StopDone(object s, RunWorkerCompletedEventArgs e)
    {
        pgBar.BarColor = C_BLUE;
        UpdateSystemState(false);
        btnStart.Enabled = true;
        btnQr.Enabled = false;
        btnTunnel.Enabled = false;
        btnTunnel.Subtitle = "Truy cập từ Internet / 4G";
        btnTunnel.BaseColor = Color.FromArgb(30, 60, 100);
        btnStop.Enabled = false;
        pgBar.Value = 0;
        lblPct.Text = "0%";
    }

    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        // Trước khi đóng Form, cố gắng tắt tiến trình server và tunnel cục bộ nếu đang chạy
        try { if (serverProc != null && !serverProc.HasExited) serverProc.Kill(); } catch { }
        try { if (tunnelProc != null && !tunnelProc.HasExited) tunnelProc.Kill(); } catch { }
        base.OnFormClosing(e);
    }

    // ══════════════════════════════════════════════════
    //  QUÉT QR KẾT NỐI DI ĐỘNG
    // ══════════════════════════════════════════════════
    private void DoShowQr()
    {
        string ip = GetLocalIPAddress();
        string mobileUrl = "http://" + ip + ":8080/index.html";
        using (QrForm qf = new QrForm(mobileUrl))
        {
            qf.ShowDialog(this);
        }
    }

    // ══════════════════════════════════════════════════
    //  KẾT NỐI QUA CLOUDFLARE TUNNEL (MẠNG 4G / NGOÀI)
    // ══════════════════════════════════════════════════
    private void DoShowTunnel()
    {
        if (tunnelProc != null && !tunnelProc.HasExited && !string.IsNullOrEmpty(tunnelUrl))
        {
            using (TunnelInfoForm tf = new TunnelInfoForm(tunnelUrl + "/index.html"))
            {
                tf.ShowDialog(this);
            }
        }
        else
        {
            StartTunnel();
        }
    }

    private void StartTunnel()
    {
        btnTunnel.Enabled = false;
        btnTunnel.Subtitle = "Đang kết nối...";
        
        Thread t = new Thread(() => {
            try
            {
                string base_ = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\', '/');
                string cfExe = Path.Combine(base_, "cloudflared.exe");
                if (!File.Exists(cfExe))
                {
                    this.Invoke((MethodInvoker)delegate {
                        MessageBox.Show("Không tìm thấy file cloudflared.exe trong thư mục gốc!", "Lỗi hệ thống", MessageBoxButtons.OK, MessageBoxIcon.Error);
                        btnTunnel.Enabled = true;
                        btnTunnel.Subtitle = "Truy cập từ Internet / 4G";
                    });
                    return;
                }

                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = cfExe;
                psi.Arguments = "tunnel --url http://localhost:8080";
                psi.WorkingDirectory = base_;
                psi.UseShellExecute = false;
                psi.CreateNoWindow = true;
                psi.RedirectStandardOutput = true;
                psi.RedirectStandardError = true;
                
                tunnelProc = new Process();
                tunnelProc.StartInfo = psi;
                
                bool foundUrl = false;
                
                DataReceivedEventHandler outputHandler = (sender, ev) => {
                    if (ev.Data != null)
                    {
                        string line = ev.Data;
                        if (line.Contains("trycloudflare.com"))
                        {
                            int idx = line.IndexOf("https://");
                            if (idx >= 0)
                            {
                                int endIdx = line.IndexOf(".trycloudflare.com", idx);
                                if (endIdx >= 0)
                                {
                                    string extracted = line.Substring(idx, endIdx + 18 - idx).Trim();
                                    StringBuilder cleanUrl = new StringBuilder();
                                    foreach (char c in extracted)
                                    {
                                        if (char.IsLetterOrDigit(c) || c == '-' || c == '.' || c == ':' || c == '/')
                                            cleanUrl.Append(c);
                                        else
                                            break;
                                    }
                                    tunnelUrl = cleanUrl.ToString();
                                    foundUrl = true;
                                }
                            }
                        }
                    }
                };

                tunnelProc.OutputDataReceived += outputHandler;
                tunnelProc.ErrorDataReceived += outputHandler;

                tunnelProc.Start();
                tunnelProc.BeginOutputReadLine();
                tunnelProc.BeginErrorReadLine();

                // Đợi tối đa 15 giây để tìm URL
                for (int i = 0; i < 30; i++)
                {
                    if (foundUrl || tunnelProc.HasExited) break;
                    Thread.Sleep(500);
                }

                if (foundUrl)
                {
                    this.Invoke((MethodInvoker)delegate {
                        btnTunnel.Enabled = true;
                        btnTunnel.Subtitle = "Đang chạy (Bấm xem QR)";
                        btnTunnel.BaseColor = Color.FromArgb(6, 182, 212);
                        
                        using (TunnelInfoForm tf = new TunnelInfoForm(tunnelUrl + "/index.html"))
                        {
                            tf.ShowDialog(this);
                        }
                    });
                }
                else
                {
                    try { if (!tunnelProc.HasExited) tunnelProc.Kill(); } catch {}
                    tunnelProc = null;
                    this.Invoke((MethodInvoker)delegate {
                        MessageBox.Show("Không thể khởi tạo Cloudflare Tunnel. Vui lòng kiểm tra lại kết nối mạng!", "Lỗi kết nối", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                        btnTunnel.Enabled = true;
                        btnTunnel.Subtitle = "Truy cập từ Internet / 4G";
                    });
                }
            }
            catch (Exception ex)
            {
                this.Invoke((MethodInvoker)delegate {
                    MessageBox.Show("Có lỗi xảy ra khi bật Tunnel: " + ex.Message, "Lỗi", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    btnTunnel.Enabled = true;
                    btnTunnel.Subtitle = "Truy cập từ Internet / 4G";
                });
            }
        });
        t.IsBackground = true;
        t.Start();
    }

    // ══════════════════════════════════════════════════
    //  HELPERS
    // ══════════════════════════════════════════════════
    private static void OpenUrlInChromeOrDefault(string url)
    {
        try
        {
            // Các đường dẫn cài đặt mặc định thông dụng của Chrome trên Windows
            string[] paths = new string[] {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Google\Chrome\Application\chrome.exe")
            };

            foreach (string p in paths)
            {
                if (File.Exists(p))
                {
                    Process.Start(p, "\"" + url + "\"");
                    return;
                }
            }

            // Nếu không tìm thấy Chrome, mở bằng trình duyệt mặc định hệ thống
            Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
        }
        catch
        {
            try
            {
                Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
            }
            catch { }
        }
    }

    public static string GetLocalIPAddress()
    {
        try
        {
            using (Socket socket = new Socket(AddressFamily.InterNetwork, SocketType.Dgram, 0))
            {
                socket.Connect("8.8.8.8", 65530);
                IPEndPoint endPoint = socket.LocalEndPoint as IPEndPoint;
                return endPoint.Address.ToString();
            }
        }
        catch
        {
            foreach (var ip in Dns.GetHostAddresses(Dns.GetHostName()))
            {
                if (ip.AddressFamily == AddressFamily.InterNetwork && !ip.ToString().StartsWith("127."))
                {
                    return ip.ToString();
                }
            }
            return "127.0.0.1";
        }
    }

    private string FindJar(string d)
    {
        string dir = Path.Combine(d, "backend", "target");
        if (!Directory.Exists(dir)) return null;
        foreach (string f in Directory.GetFiles(dir, "*.jar"))
        {
            string n = Path.GetFileName(f).ToLower();
            if (!n.Contains("sources") && !n.Contains("javadoc") && !n.Contains("original")) return f;
        }
        return null;
    }

    private bool JavaOk()
    {
        try
        {
            ProcessStartInfo p = new ProcessStartInfo();
            p.FileName = "java"; 
            p.Arguments = "-version";
            p.UseShellExecute = false; 
            p.CreateNoWindow = true; 
            p.RedirectStandardError = true;
            Process.Start(p).WaitForExit(3000); 
            return true;
        }
        catch { return false; }
    }

    private bool PortOpen(int port)
    {
        try
        {
            using (TcpClient c = new TcpClient())
            {
                c.Connect("localhost", port);
                return true;
            }
        }
        catch { return false; }
    }

    // Helper trộn màu mượt mà khi hover
    public static Color Blend(Color color, Color backColor, float amount)
    {
        byte r = (byte)((color.R * (1f - amount)) + (backColor.R * amount));
        byte g = (byte)((color.G * (1f - amount)) + (backColor.G * amount));
        byte b = (byte)((color.B * (1f - amount)) + (backColor.B * amount));
        return Color.FromArgb(color.A, r, g, b);
    }

    // Helper bo tròn đa dụng
    public static GraphicsPath GetRoundedRectPath(Rectangle bounds, int radius)
    {
        int diameter = radius * 2;
        Size size = new Size(diameter, diameter);
        Rectangle arc = new Rectangle(bounds.Location, size);
        GraphicsPath path = new GraphicsPath();

        if (radius == 0)
        {
            path.AddRectangle(bounds);
            return path;
        }

        path.AddArc(arc, 180, 90);
        arc.X = bounds.Right - diameter;
        path.AddArc(arc, 270, 90);
        arc.Y = bounds.Bottom - diameter;
        path.AddArc(arc, 0, 90);
        arc.X = bounds.Left;
        path.AddArc(arc, 90, 90);
        path.CloseFigure();
        return path;
    }
}

// ══════════════════════════════════════════════════════
//  QrForm - Hộp thoại hiển thị mã QR & hướng dẫn kết nối
// ══════════════════════════════════════════════════════
class QrForm : Form
{
    private string _url;
    private PictureBox _picQr;
    private Label _lblUrl;
    private bool _qrLoadFailed = false;
    private bool _tryingHttp = false;

    public QrForm(string url)
    {
        this._url = url;
        this.ClientSize = new Size(380, 440);
        this.BackColor = Color.FromArgb(12, 18, 34);
        this.FormBorderStyle = FormBorderStyle.None;
        this.StartPosition = FormStartPosition.CenterParent;
        this.ShowInTaskbar = false;

        // Kích hoạt TLS 1.2 (3072) để tải hình ảnh HTTPS trên mọi phiên bản .NET Framework
        try
        {
            ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072 | (SecurityProtocolType)768 | SecurityProtocolType.Tls;
        }
        catch { }

        // Bo tròn góc cho Form QR
        this.Load += (s, e) => {
            this.Region = new Region(MainForm.GetRoundedRectPath(new Rectangle(0, 0, this.Width, this.Height), 20));
        };

        // Header Panel chứa tiêu đề và nút đóng
        Panel pnlHeader = new Panel() {
            Dock = DockStyle.Top,
            Height = 52,
            BackColor = Color.FromArgb(18, 26, 48)
        };
        
        Label lblTitle = new Label() {
            Text = "📱 KẾT NỐI ĐIỆN THOẠI",
            ForeColor = Color.White,
            Font = new Font("Segoe UI", 10.5f, FontStyle.Bold),
            Location = new Point(16, 16),
            AutoSize = true
        };
        pnlHeader.Controls.Add(lblTitle);

        Button btnClose = new Button() {
            Text = "✕",
            ForeColor = Color.White,
            FlatStyle = FlatStyle.Flat,
            Size = new Size(32, 32),
            Location = new Point(336, 10),
            Font = new Font("Segoe UI", 11f, FontStyle.Bold),
            Cursor = Cursors.Hand
        };
        btnClose.FlatAppearance.BorderSize = 0;
        btnClose.FlatAppearance.MouseOverBackColor = Color.FromArgb(239, 68, 68);
        btnClose.Click += (s, e) => this.Close();
        pnlHeader.Controls.Add(btnClose);
        this.Controls.Add(pnlHeader);

        // Khung ảnh QR Code
        _picQr = new PictureBox() {
            Size = new Size(200, 200),
            Location = new Point(90, 76),
            SizeMode = PictureBoxSizeMode.Zoom,
            BackColor = Color.White,
            Padding = new Padding(8)
        };
        this.Controls.Add(_picQr);

        // Hướng dẫn sử dụng
        Label lblDesc = new Label() {
            Text = "1. Đảm bảo điện thoại và máy tính kết nối chung mạng Wi-Fi.\n2. Mở camera hoặc phần mềm quét mã QR trên điện thoại để quét và truy cập tức thì.",
            ForeColor = Color.FromArgb(148, 163, 184),
            Font = new Font("Segoe UI", 9f),
            Location = new Point(24, 292),
            Size = new Size(332, 44),
            TextAlign = ContentAlignment.MiddleCenter
        };
        this.Controls.Add(lblDesc);

        // Đường chia ngăn tinh tế
        Panel pnlDiv = new Panel() {
            Location = new Point(24, 350),
            Size = new Size(332, 1),
            BackColor = Color.FromArgb(30, 45, 75)
        };
        this.Controls.Add(pnlDiv);

        // Hiển thị đường link kết nối (Click để tự mở thử trên PC)
        _lblUrl = new Label() {
            Text = _url,
            ForeColor = Color.FromArgb(99, 102, 241),
            Font = new Font("Segoe UI", 10.5f, FontStyle.Bold | FontStyle.Underline),
            Location = new Point(24, 362),
            Size = new Size(332, 24),
            TextAlign = ContentAlignment.MiddleCenter,
            Cursor = Cursors.Hand
        };
        _lblUrl.Click += (s, e) => {
            try { Process.Start(new ProcessStartInfo(_url) { UseShellExecute = true }); } catch { }
        };
        this.Controls.Add(_lblUrl);

        Label lblTip = new Label() {
            Text = "(Hoặc gõ tay địa chỉ trên vào trình duyệt điện thoại)",
            ForeColor = Color.FromArgb(100, 110, 130),
            Font = new Font("Segoe UI", 8f, FontStyle.Italic),
            Location = new Point(24, 390),
            Size = new Size(332, 18),
            TextAlign = ContentAlignment.MiddleCenter
        };
        this.Controls.Add(lblTip);

        // Xử lý nạp mã QR và lỗi nạp
        _picQr.LoadCompleted += (s, e) => {
            if (e.Error != null)
            {
                if (!_tryingHttp && _picQr.ImageLocation.StartsWith("https://"))
                {
                    _tryingHttp = true;
                    // Thử chuyển sang giao thức HTTP thường nếu HTTPS lỗi handshake
                    _picQr.ImageLocation = _picQr.ImageLocation.Replace("https://", "http://");
                }
                else
                {
                    // Lỗi cả 2 phương thức (ví dụ máy tính ngoại tuyến/không có internet)
                    _qrLoadFailed = true;
                    _picQr.Image = null;
                    _picQr.Invalidate();
                }
            }
            else
            {
                _qrLoadFailed = false;
                _picQr.Invalidate();
            }
        };

        // Nạp mã QR khi cửa sổ hiển thị
        this.Shown += (s, e) => {
            try
            {
                _qrLoadFailed = false;
                _tryingHttp = false;
                string qrApi = "https://api.qrserver.com/v1/create-qr-code/?size=184x184&data=" + Uri.EscapeDataString(_url);
                _picQr.ImageLocation = qrApi;
            }
            catch { }
        };

        // Vẽ chữ hiển thị trong khi đợi nạp mã QR hoặc khi lỗi nạp
        _picQr.Paint += (s, pe) => {
            pe.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            if (_qrLoadFailed)
            {
                using (Font f = new Font("Segoe UI", 9.5f, FontStyle.Bold))
                using (SolidBrush br = new SolidBrush(Color.FromArgb(239, 68, 68)))
                {
                    StringFormat sf = new StringFormat() { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
                    pe.Graphics.DrawString("Không Có Internet\nHoặc API Bị Chặn!\n\nVui lòng gõ địa chỉ\nIP bên dưới.", f, br, new RectangleF(10, 10, 180, 180), sf);
                }
            }
            else if (_picQr.Image == null)
            {
                using (Font f = new Font("Segoe UI", 9.5f, FontStyle.Bold))
                using (SolidBrush br = new SolidBrush(Color.FromArgb(120, 120, 120)))
                {
                    StringFormat sf = new StringFormat() { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
                    pe.Graphics.DrawString("Đang tải QR Code...", f, br, new RectangleF(0, 0, 200, 200), sf);
                }
            }
        };
    }
}

// ══════════════════════════════════════════════════════
//  TunnelInfoForm - Hộp thoại hiển thị mã QR & hướng dẫn kết nối qua Cloudflare Tunnel (4G)
// ══════════════════════════════════════════════════════
class TunnelInfoForm : Form
{
    private string _url;
    private PictureBox _picQr;
    private Label _lblUrl;
    private bool _qrLoadFailed = false;
    private bool _tryingHttp = false;

    public TunnelInfoForm(string url)
    {
        this._url = url;
        this.ClientSize = new Size(380, 440);
        this.BackColor = Color.FromArgb(12, 18, 34);
        this.FormBorderStyle = FormBorderStyle.None;
        this.StartPosition = FormStartPosition.CenterParent;
        this.ShowInTaskbar = false;

        try
        {
            ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072 | (SecurityProtocolType)768 | SecurityProtocolType.Tls;
        }
        catch { }

        this.Load += (s, e) => {
            this.Region = new Region(MainForm.GetRoundedRectPath(new Rectangle(0, 0, this.Width, this.Height), 20));
        };

        Panel pnlHeader = new Panel() {
            Dock = DockStyle.Top,
            Height = 52,
            BackColor = Color.FromArgb(18, 26, 48)
        };
        
        Label lblTitle = new Label() {
            Text = "🌐 TRUY CẬP INTERNET / 4G",
            ForeColor = Color.White,
            Font = new Font("Segoe UI", 10.5f, FontStyle.Bold),
            Location = new Point(16, 16),
            AutoSize = true
        };
        pnlHeader.Controls.Add(lblTitle);

        Button btnClose = new Button() {
            Text = "✕",
            ForeColor = Color.White,
            FlatStyle = FlatStyle.Flat,
            Size = new Size(32, 32),
            Location = new Point(336, 10),
            Font = new Font("Segoe UI", 11f, FontStyle.Bold),
            Cursor = Cursors.Hand
        };
        btnClose.FlatAppearance.BorderSize = 0;
        btnClose.FlatAppearance.MouseOverBackColor = Color.FromArgb(239, 68, 68);
        btnClose.Click += (s, e) => this.Close();
        pnlHeader.Controls.Add(btnClose);
        this.Controls.Add(pnlHeader);

        _picQr = new PictureBox() {
            Size = new Size(200, 200),
            Location = new Point(90, 76),
            SizeMode = PictureBoxSizeMode.Zoom,
            BackColor = Color.White,
            Padding = new Padding(8)
        };
        this.Controls.Add(_picQr);

        Label lblDesc = new Label() {
            Text = "1. Quét mã QR bằng điện thoại (sử dụng 4G hoặc mạng ngoài).\n2. Giao diện quản lý phòng trọ sẽ tự động tải trực tiếp từ Internet.",
            ForeColor = Color.FromArgb(148, 163, 184),
            Font = new Font("Segoe UI", 9f),
            Location = new Point(24, 292),
            Size = new Size(332, 44),
            TextAlign = ContentAlignment.MiddleCenter
        };
        this.Controls.Add(lblDesc);

        Panel pnlDiv = new Panel() {
            Location = new Point(24, 350),
            Size = new Size(332, 1),
            BackColor = Color.FromArgb(30, 45, 75)
        };
        this.Controls.Add(pnlDiv);

        _lblUrl = new Label() {
            Text = _url,
            ForeColor = Color.FromArgb(6, 182, 212),
            Font = new Font("Segoe UI", 9.5f, FontStyle.Bold | FontStyle.Underline),
            Location = new Point(24, 362),
            Size = new Size(332, 24),
            TextAlign = ContentAlignment.MiddleCenter,
            Cursor = Cursors.Hand
        };
        _lblUrl.Click += (s, e) => {
            try { Process.Start(new ProcessStartInfo(_url) { UseShellExecute = true }); } catch { }
        };
        this.Controls.Add(_lblUrl);

        Label lblTip = new Label() {
            Text = "(Nhấp vào link để tự mở kiểm tra thử trên máy tính)",
            ForeColor = Color.FromArgb(100, 110, 130),
            Font = new Font("Segoe UI", 8f, FontStyle.Italic),
            Location = new Point(24, 390),
            Size = new Size(332, 18),
            TextAlign = ContentAlignment.MiddleCenter
        };
        this.Controls.Add(lblTip);

        _picQr.LoadCompleted += (s, e) => {
            if (e.Error != null)
            {
                if (!_tryingHttp && _picQr.ImageLocation.StartsWith("https://"))
                {
                    _tryingHttp = true;
                    _picQr.ImageLocation = _picQr.ImageLocation.Replace("https://", "http://");
                }
                else
                {
                    _qrLoadFailed = true;
                    _picQr.Image = null;
                    _picQr.Invalidate();
                }
            }
            else
            {
                _qrLoadFailed = false;
                _picQr.Invalidate();
            }
        };

        this.Shown += (s, e) => {
            try
            {
                _qrLoadFailed = false;
                _tryingHttp = false;
                string qrApi = "https://api.qrserver.com/v1/create-qr-code/?size=184x184&data=" + Uri.EscapeDataString(_url);
                _picQr.ImageLocation = qrApi;
            }
            catch { }
        };

        _picQr.Paint += (s, pe) => {
            pe.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            if (_qrLoadFailed)
            {
                using (Font f = new Font("Segoe UI", 9.5f, FontStyle.Bold))
                using (SolidBrush br = new SolidBrush(Color.FromArgb(239, 68, 68)))
                {
                    StringFormat sf = new StringFormat() { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
                    pe.Graphics.DrawString("Không Có Internet\nHoặc API Bị Chặn!\n\nVui lòng gõ địa chỉ\nURL bên dưới.", f, br, new RectangleF(10, 10, 180, 180), sf);
                }
            }
            else if (_picQr.Image == null)
            {
                using (Font f = new Font("Segoe UI", 9.5f, FontStyle.Bold))
                using (SolidBrush br = new SolidBrush(Color.FromArgb(120, 120, 120)))
                {
                    StringFormat sf = new StringFormat() { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
                    pe.Graphics.DrawString("Đang tải QR Code...", f, br, new RectangleF(0, 0, 200, 200), sf);
                }
            }
        };
    }
}
