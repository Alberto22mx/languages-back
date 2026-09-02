import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly transporter?: nodemailer.Transporter;
  private readonly mail?: string;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.enabled =
      this.configService.get<string>('MAIL_ENABLED', 'true') === 'true';

    if (!this.enabled) {
      return;
    }

    this.mail = this.configService.getOrThrow<string>('MAIL_USER');
    this.transporter = nodemailer.createTransport({
      service: this.configService.get<string>('MAIL_PROVIDER', 'gmail'),
      auth: {
        user: this.mail,
        pass: this.configService.getOrThrow<string>('MAIL_PASSWORD'),
      },
    });
  }

  async sendMail(subject: string, user: CreateUserDto, plainPassword: string) {
    if (!this.enabled) {
      return;
    }

    const mailOptions = {
      from: this.mail,
      to: user.email,
      subject,
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
      const info = await this.transporter!.sendMail(mailOptions);
      console.log('Correo enviado: ', info.messageId);
      return info;
    } catch (error) {
      console.error('Error al enviar correo:', error);
      throw error;
    }
  }
}
