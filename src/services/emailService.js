const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransporter({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: process.env.EMAIL_PORT || 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    async sendEmail({ to, subject, text, html, attachments = [] }) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to,
                subject,
                text,
                html,
                attachments
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('📧 Email sent successfully:', result.messageId);
            return result;
        } catch (error) {
            console.error('❌ Email sending failed:', error);
            throw error;
        }
    }

    async sendBookingConfirmation(booking, customer) {
        const subject = `Booking Confirmation - ${booking.bookingReference}`;
        const html = `
            <h2>Booking Confirmation</h2>
            <p>Dear ${customer.firstName} ${customer.lastName},</p>
            <p>Thank you for your booking with Eternity Africa Tourism Portal!</p>
            
            <h3>Booking Details:</h3>
            <ul>
                <li><strong>Reference:</strong> ${booking.bookingReference}</li>
                <li><strong>Tour:</strong> ${booking.tourPackage.name}</li>
                <li><strong>Departure Date:</strong> ${new Date(booking.bookingDetails.departureDate).toDateString()}</li>
                <li><strong>Duration:</strong> ${booking.tourPackage.duration.days} days / ${booking.tourPackage.duration.nights} nights</li>
                <li><strong>Travelers:</strong> ${booking.bookingDetails.numberOfTravelers.adults} adults, ${booking.bookingDetails.numberOfTravelers.children} children</li>
                <li><strong>Total Amount:</strong> ${booking.pricing.currency} ${booking.pricing.totalAmount}</li>
            </ul>
            
            <p>We will contact you soon with further details about your upcoming adventure!</p>
            
            <p>Best regards,<br>Eternity Africa Tourism Team</p>
        `;

        return await this.sendEmail({
            to: customer.email,
            subject,
            html
        });
    }

    async sendPasswordReset(user, resetToken) {
        const subject = 'Password Reset Request';
        const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        
        const html = `
            <h2>Password Reset Request</h2>
            <p>Dear ${user.firstName} ${user.lastName},</p>
            <p>You requested a password reset for your account.</p>
            <p>Please click the link below to reset your password:</p>
            <p><a href="${resetUrl}">Reset Password</a></p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
            
            <p>Best regards,<br>Eternity Africa Tourism Team</p>
        `;

        return await this.sendEmail({
            to: user.email,
            subject,
            html
        });
    }
}

module.exports = new EmailService();