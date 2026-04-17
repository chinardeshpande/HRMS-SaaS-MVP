const nodemailer = require('nodemailer');

// Mailtrap configuration
const transporter = nodemailer.createTransport({
  host: 'sandbox.smtp.mailtrap.io',
  port: 2525,
  auth: {
    user: '4faee386cc7855',
    pass: '7f40913f799d38',
  },
});

const testEmail = async () => {
  try {
    console.log('🔄 Testing email service...\n');

    // Test 1: Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection verified\n');

    // Test 2: Send test email
    const info = await transporter.sendMail({
      from: 'noreply@aurorahr.in',
      to: 'test@example.com',
      subject: '🎉 Test Email from AuroraHR',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px;">
            <h1 style="color: #667eea;">Email Service is Working! 🚀</h1>
            <p>If you can see this email in your Mailtrap inbox, your email service is configured correctly.</p>
            <p><strong>Time sent:</strong> ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
      text: 'Email Service is Working! If you can see this email, your configuration is correct.',
    });

    console.log('✅ Test email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('\n📬 Check your Mailtrap inbox at: https://mailtrap.io/inboxes\n');

  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    process.exit(1);
  }
};

testEmail();
