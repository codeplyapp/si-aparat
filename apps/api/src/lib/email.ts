/**
 * Email Notification — Resend SDK
 *
 * Mengirim email ke semua MPK saat laporan baru masuk.
 *
 * ⚠️  PENTING — Privacy by Design:
 *   Email TIDAK berisi konten laporan.
 *   Email HANYA berisi: kategori + kode tracking.
 *   Ini mencegah kebocoran jika email MPK diakses pihak tidak berwenang.
 *
 * Env vars:
 *   RESEND_API_KEY    — API key dari resend.com
 *   EMAIL_FROM        — Alamat pengirim (misal: noreply@aparat.sch.id)
 */

import { Resend } from 'resend';
import { KategoriLaporan } from '@si-aparat/shared';

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured');
  return new Resend(apiKey);
}

function getFromEmail(): string {
  return process.env.EMAIL_FROM ?? 'SI-APARAT <onboarding@resend.dev>';
}

const KATEGORI_LABELS: Record<KategoriLaporan, string> = {
  [KategoriLaporan.SARANA]: 'Sarana & Prasarana',
  [KategoriLaporan.KEGIATAN]: 'Kegiatan',
  [KategoriLaporan.PERUNDUNGAN]: '🚨 PERUNDUNGAN / BULLYING',
  [KategoriLaporan.LAINNYA]: 'Lainnya',
};

/**
 * Kirim notifikasi email ke semua alamat MPK saat laporan baru masuk.
 *
 * @param recipientEmails - List email MPK dari database
 * @param kategori - Kategori laporan
 * @param kodeTracking - Kode tracking laporan (APR-YYYYMMDD-XXXX)
 */
export async function sendNewReportNotification(
  recipientEmails: string[],
  kategori: KategoriLaporan,
  kodeTracking: string,
): Promise<void> {
  if (recipientEmails.length === 0) return;

  const resend = getResendClient();
  const isPerundungan = kategori === KategoriLaporan.PERUNDUNGAN;

  const subject = isPerundungan
    ? `🚨 [PRIORITAS] Laporan Perundungan Baru — ${kodeTracking}`
    : `[SI-APARAT] Laporan Baru Masuk — ${kodeTracking}`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <div style="border-left: 4px solid ${isPerundungan ? '#dc2626' : '#2563eb'}; padding-left: 16px; margin-bottom: 24px;">
    <h1 style="margin: 0 0 8px; font-size: 20px; color: ${isPerundungan ? '#dc2626' : '#1e40af'};">
      ${isPerundungan ? '🚨 Laporan Perundungan — Prioritas Tinggi' : '📋 Laporan Baru Masuk'}
    </h1>
    <p style="margin: 0; color: #6b7280; font-size: 14px;">SI-APARAT — Sistem Informasi & Aspirasi Taruna</p>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <tr>
      <td style="padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: bold; width: 40%;">Kode Tracking</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb; font-family: monospace; font-size: 16px; font-weight: bold;">${kodeTracking}</td>
    </tr>
    <tr>
      <td style="padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: bold;">Kategori</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb; color: ${isPerundungan ? '#dc2626' : '#1a1a1a'}; font-weight: ${isPerundungan ? 'bold' : 'normal'};">${KATEGORI_LABELS[kategori]}</td>
    </tr>
    <tr>
      <td style="padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: bold;">Waktu Masuk</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</td>
    </tr>
  </table>

  ${isPerundungan ? `
  <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
    <p style="margin: 0; color: #dc2626; font-weight: bold;">⚠️ Laporan ini bersifat PRIORITAS TINGGI.</p>
    <p style="margin: 8px 0 0; color: #7f1d1d; font-size: 14px;">Sesuai SOP, laporan perundungan harus ditangani dalam 1×24 jam. Segera login ke dashboard MPK untuk meninjau laporan ini.</p>
  </div>
  ` : ''}

  <p style="color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
    Email ini dikirim otomatis oleh sistem SI-APARAT.<br>
    <strong>Email ini tidak berisi konten laporan</strong> untuk menjaga kerahasiaan pelapor.<br>
    Silakan login ke dashboard MPK untuk membaca laporan secara aman.
  </p>
</body>
</html>
  `;

  // Kirim ke setiap recipient
  const adminEmail = process.env.ADMIN_EMAIL ?? 'codeplyapp@gmail.com';

  for (const recipient of recipientEmails) {
    try {
      const response = await resend.emails.send({
        from: getFromEmail(),
        to: recipient,
        subject,
        html: htmlContent,
      });

      if (response.error) {
        console.warn(`⚠️ [Resend] Failed to send email to ${recipient}:`, response.error.message);

        // Jika kena batasan mode testing Resend (onboarding@resend.dev), alihkan notifikasi ke ADMIN_EMAIL
        if (
          response.error.message?.includes('testing emails to your own email address') &&
          recipient !== adminEmail
        ) {
          console.log(`ℹ️ [Resend Testing Mode] Forwarding email for ${recipient} to Admin (${adminEmail})...`);
          await resend.emails.send({
            from: getFromEmail(),
            to: adminEmail,
            subject: `[FORWARDED TO ADMIN] ${subject}`,
            html: `
              <div style="background: #fffbebf9; border: 2px solid #f59e0b; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; color: #92400e;">
                📌 <strong>Catatan Testing Resend API:</strong><br>
                Email notifikasi ini ditujukan untuk MPK: <code>${recipient}</code>.<br>
                Karena Resend menggunakan domain gratis <code>onboarding@resend.dev</code>, Resend membatasi penerima hanya ke email pemilik akun (<code>${adminEmail}</code>).
              </div>
            ` + htmlContent,
          });
        }
      } else {
        console.log(`✅ [Resend] Email sent to ${recipient} (id: ${response.data?.id})`);
      }
    } catch (err) {
      console.warn(`⚠️ [Resend] Exception sending email to ${recipient}:`, err);
    }
  }
}
