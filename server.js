const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { Resend } = require("resend");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send("Inspirational Graffiti backend is running.");
});

const resend = new Resend(process.env.RESEND_API_KEY);

const verificationCodes = {};

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

app.post("/send-code", async (req, res) => {
  const { email, hcaptchaToken } = req.body;

  if (!email || !hcaptchaToken) {
    return res.status(400).json({ error: "Missing email or captcha token" });
  }

  try {
    const captchaRes = await axios.post(
      "https://hcaptcha.com/siteverify",
      null,
      {
        params: {
          secret: process.env.HCAPTCHA_SECRET,
          response: hcaptchaToken
        }
      }
    );

    if (!captchaRes.data.success) {
      return res.status(400).json({ error: "Captcha failed" });
    }
  } catch (err) {
    console.error("hCaptcha verification error:", err?.response?.data || err.message);
    return res.status(500).json({ error: "Captcha verification error" });
  }

  const code = generateCode();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  verificationCodes[email] = { code, expiresAt };

  try {
    await resend.emails.send({
      from: "Inspirational Graffiti <onboarding@resend.dev>",
      to: email,
      subject: "Your Inspirational Graffiti verification code",
      html: `
        <p>Hi there,</p>
        <p>Your verification code for Inspirational Graffiti is:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p>
        <p>This code will expire in 10 minutes.</p>
      `
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Send code error:", err?.response?.data || err.message);
    res.status(500).json({ error: "Failed to send verification code" });
  }
});

app.post("/verify-code", (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: "Email and code are required" });
  }

  const record = verificationCodes[email];

  if (!record) {
    return res.status(400).json({ error: "No code found for this email" });
  }

  if (Date.now() > record.expiresAt) {
    delete verificationCodes[email];
    return res.status(400).json({ error: "Code has expired" });
  }

  if (record.code !== code) {
    return res.status(400).json({ error: "Incorrect code" });
  }

  delete verificationCodes[email];
  return res.status(200).json({ success: true });
});

app.post("/send-email", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    await resend.emails.send({
      from: "Inspirational Graffiti <onboarding@resend.dev>",
      to: "inspirationalgraffiti@gmail.com",
      subject: `New contact form message from ${name}`,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Email error:", err?.response?.data || err.message);
    res.status(500).json({ error: "Failed to send email" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Contact backend running on http://localhost:${PORT}`);
});
