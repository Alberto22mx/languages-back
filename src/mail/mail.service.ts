import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private mail = process.env.MAIL_USER;

  constructor() {
    const pass = process.env.MAIL_PASSWORD;
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.mail, // Tu correo de Gmail
        pass: pass, // Tu contraseña de Gmail o App Password
      },
    });
  }

  async sendMail(subject: string, user: CreateUserDto, plainPassword: string) {
    const mailOptions = {
      from: this.mail, // Remitente
      to: user.email, // Destinatario(s)
      subject, // Asunto
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Bienvenido ${user.firstName} ${user.lastNameFather}</h2>
          <p>Tu cuenta ha sido creada exitosamente.</p>
          <p>Tus credenciales de acceso son:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
            <p><strong>Usuario:</strong> ${user.registrationNumber}</p>
            <p><strong>Contraseña:</strong> ${plainPassword}</p>
          </div>
          <p>Si no solicitaste esta cuenta, por favor ignora este correo.</p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Correo enviado: ', info.messageId);
      return info;
    } catch (error) {
      console.error('Error al enviar correo:', error);
      throw error;
    }
  }
}
