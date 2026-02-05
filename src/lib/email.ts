import nodemailer from 'nodemailer'

// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
})

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
      console.warn("⚠️ SMTP credentials missing in .env. Email not sent.")
      console.log("Recipient:", to)
      console.log("Subject:", subject)
      return false
    }

    const info = await transporter.sendMail({
      from: `"scrutinize-devarena" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      html,
    })

    console.log("Email sent successfully: %s", info.messageId)
    return true
  } catch (error) {
    console.error("Error sending email via SMTP:", error)
    return false
  }
}