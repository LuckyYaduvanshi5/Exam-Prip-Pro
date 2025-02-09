import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendWelcomeEmail(email: string, username: string) {
  try {
    await mailService.send({
      to: email,
      from: 'noreply@studyai.com', // Update this with your verified sender
      subject: 'Welcome to StudyAI',
      html: `
        <h1>Welcome to StudyAI, ${username}!</h1>
        <p>Thank you for registering. You can now start uploading your study materials for AI analysis.</p>
        <p>Get started by uploading your past papers and syllabi.</p>
      `,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}
