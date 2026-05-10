import type { NewsItem } from "@/types";
import { formatDate } from "@/lib/utils";

export function printNews(news: NewsItem): void {
  const displayPejabat = Array.isArray(news.pejabat)
    ? news.pejabat.join(", ")
    : news.pejabat || "-";
  const displayUnit = news.unit || "-";
  const fullDateStr = formatDate(news.tanggal_raw);

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Popup diblokir. Izinkan popup untuk mencetak.");
    return;
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>&nbsp;</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@600;800&family=Inter:wght@400;500;600&display=swap');
          body { font-family: 'Inter', sans-serif; padding: 20px 40px; line-height: 1.6; color: #0f172a; max-width: 900px; margin: 0 auto; }
          .top-header { text-align: center; font-size: 26px; font-weight: 800; font-family: 'Montserrat', sans-serif; margin-bottom: 12px; color: #000; }
          hr.thick { border: none; border-bottom: 3px solid #0f172a; margin-bottom: 25px; }
          .title { font-size: 22px; font-weight: 800; font-family: 'Montserrat', sans-serif; color: #000; margin-bottom: 12px; line-height: 1.4; }
          .meta-row { display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 500; color: #334155; margin-bottom: 25px; flex-wrap: wrap; }
          .meta-divider { color: #cbd5e1; margin: 0 4px; }
          .content { white-space: pre-wrap; font-size: 14px; text-align: justify; line-height: 1.8; color: #1e293b; }
          @page { size: A4; margin: 20mm; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="top-header">Rekapan KataKita</div>
        <hr class="thick" />
        <div class="title">${news.judul}</div>
        <div class="meta-row">
          <i class="fas fa-calendar"></i> ${fullDateStr}
          <span class="meta-divider">|</span>
          <i class="fas fa-desktop"></i> ${news.media}
          <span class="meta-divider">|</span>
          <i class="fas fa-user"></i> ${displayPejabat}
          <span class="meta-divider">|</span>
          Unit: ${displayUnit}
          <span class="meta-divider">|</span>
          Potensi: ${news.potensi || "Netral"}
        </div>
        <div class="content">${news.isi}</div>
        <script>
          window.onload = function() {
            setTimeout(() => { window.print(); }, 800);
          };
        <\/script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
