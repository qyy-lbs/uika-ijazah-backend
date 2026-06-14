import nodemailer from "nodemailer";

type EmailLink = {
  jenis: string;
  url: string;
};

type SendStudentDocumentEmailInput = {
  to: string;
  nama: string | null;
  nim: string;
  batchName: string;
  links: EmailLink[];
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function getJenisLabel(jenis: string) {
  const normalized = jenis.toLowerCase();

  if (normalized === "ijazah") return "Ijazah";
  if (normalized === "transkrip") return "Transkrip Nilai";

  return jenis;
}

function buildButton(link: EmailLink) {
  const label = getJenisLabel(link.jenis);

  return `
    <tr>
      <td style="padding: 8px 0;">
        <a href="${link.url}"
          target="_blank"
          style="
            display: inline-block;
            background-color: #117065;
            color: #ffffff;
            text-decoration: none;
            padding: 12px 18px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 700;
            font-family: Arial, sans-serif;
          ">
          Download ${label}
        </a>
      </td>
    </tr>
  `;
}

export async function sendStudentDocumentEmail(
  input: SendStudentDocumentEmailInput,
) {
  const fromName = process.env.MAIL_FROM_NAME || "UIKA Ijazah Digital";
  const fromAddress = process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER;

  if (!fromAddress) {
    throw new Error("MAIL_FROM_ADDRESS atau SMTP_USER belum diatur");
  }

  const buttons = input.links.map(buildButton).join("");

  const textLinks = input.links
    .map((link) => `${getJenisLabel(link.jenis)}: ${link.url}`)
    .join("\n");

  const html = `
<!doctype html>
<html>
  <body style="margin:0; padding:0; background-color:#f3f4f6;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
      Dokumen digital Anda untuk ${input.batchName} sudah tersedia.
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6; padding:24px 0;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background:#ffffff; border-radius:14px; overflow:hidden; font-family:Arial, sans-serif;">
            
            <tr>
              <td style="background:#117065; padding:22px 28px;">
                <div style="font-size:20px; font-weight:700; color:#ffffff;">
                  UIKA Ijazah Digital
                </div>
                <div style="font-size:13px; color:#d1fae5; margin-top:4px;">
                  Layanan Dokumen Akademik Digital
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:28px;">
                <h2 style="margin:0 0 12px; color:#111827; font-size:20px;">
                  Dokumen Digital Anda Sudah Tersedia
                </h2>

                <p style="margin:0 0 14px; color:#374151; font-size:14px; line-height:1.6;">
                  Halo <b>${input.nama || input.nim}</b>,
                </p>

                <p style="margin:0 0 18px; color:#374151; font-size:14px; line-height:1.6;">
                  Dokumen akademik digital Anda untuk <b>${input.batchName}</b> sudah tersedia.
                  Silakan gunakan tombol di bawah ini untuk mengunduh dokumen.
                </p>

                <table cellpadding="0" cellspacing="0">
                  ${buttons}
                </table>

                <div style="margin-top:22px; padding:14px; background:#f9fafb; border-left:4px solid #117065; border-radius:8px;">
                  <p style="margin:0; color:#4b5563; font-size:13px; line-height:1.6;">
                    Link download memiliki masa berlaku dan hanya dapat digunakan sesuai batas download yang ditentukan.
                    Jangan bagikan link ini kepada pihak lain.
                  </p>
                </div>

                <p style="margin:22px 0 0; color:#6b7280; font-size:13px; line-height:1.6;">
                  Jika Anda merasa tidak meminta dokumen ini, abaikan email ini atau hubungi pihak administrasi kampus.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 28px; background:#f9fafb; border-top:1px solid #e5e7eb;">
                <p style="margin:0; color:#6b7280; font-size:12px; line-height:1.5;">
                  Email ini dikirim otomatis oleh sistem UIKA Ijazah Digital.
                  Mohon tidak membalas email ini secara langsung.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

  return transporter.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to: input.to,
    replyTo: process.env.MAIL_REPLY_TO || fromAddress,
    subject: `Dokumen Digital Anda Sudah Tersedia - ${input.batchName}`,
    text: `Halo ${input.nama || input.nim},

Dokumen digital Anda untuk ${input.batchName} sudah tersedia.

Silakan download melalui link berikut:

${textLinks}

Link download memiliki masa berlaku dan hanya dapat digunakan sesuai batas download yang ditentukan.

Terima kasih,
UIKA Ijazah Digital`,
    html,
  });
}