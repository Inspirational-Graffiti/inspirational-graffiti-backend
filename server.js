const express = require("express");
const cors = require("cors");
const { Resend } = require("resend");

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Resend with your API key
const resend = new Resend("re_eProcB9F_66VKuLCgWfukH3A8hcnp5RKj");

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
        <p><strong>Message:</strong> ${message}</p>
      `
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Contact backend running on http://localhost:${PORT}`);
});
