import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter?: nodemailer.Transporter;
  private readonly mail?: string;
  private readonly enabled: boolean;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.enabled =
      this.configService.get<string>('MAIL_ENABLED', 'false') === 'true';
    this.frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:4200',
    );
    if (!this.enabled) return;

    this.mail = this.configService.getOrThrow<string>('MAIL_USER');
    this.transporter = nodemailer.createTransport({
      service: this.configService.get<string>('MAIL_PROVIDER', 'gmail'),
      auth: {
        user: this.mail,
        pass: this.configService.getOrThrow<string>('MAIL_PASSWORD'),
      },
    });
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async sendAccountSetup(user: User, token: string): Promise<void> {
    if (!this.enabled) return;

    const url = new URL('/set-password', this.frontendUrl);
    url.searchParams.set('registrationNumber', user.registrationNumber);
    url.hash = new URLSearchParams({ token }).toString();
    await this.transporter!.sendMail({
      from: this.mail,
      to: user.email,
      subject: 'Activa tu cuenta',
      text: `Tu matrícula es ${user.registrationNumber}. Define tu contraseña dentro de las próximas 24 horas: ${url.toString()}`,
      html: `<p>Tu cuenta ha sido creada.</p><p>Matrícula: <strong>${this.escapeHtml(user.registrationNumber)}</strong></p><p><a href="${this.escapeHtml(url.toString())}">Define tu contraseña</a>. Este enlace vence en 24 horas.</p>`,
    });
    this.logger.log('Correo de activación enviado');
  }

  private escapeHtml(value: string): string {
    return value.replace(
      /[&<>'"]/g,
      (character) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          "'": '&#39;',
          '"': '&quot;',
        })[character],
    );
  }
}
