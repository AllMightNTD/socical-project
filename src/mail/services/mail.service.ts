import { MailerService } from '@nestjs-modules/mailer';
import { OnQueueActive, OnQueueCompleted, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bull';

@Injectable()
@Processor('mail')
export class MailService {
  constructor(
    private readonly logger = new Logger(MailService.name),
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    // empty
  }

  @OnQueueActive()
  onActive(job: Job) {
    const info = {
      pid: job.id,
      queue: job.queue.name,
      action: job.name,
      data: job.data,
    };

    this.logger.debug('JOB IS PROCESSING: ', info);
  }

  @OnQueueCompleted()
  onComplete(job: Job) {
    const info = {
      pid: job.id,
      queue: job.queue.name,
      action: job.name,
    };

    this.logger.debug('JOB IS COMPLETED: ', info);
  }

  //   @Process('reset-password')
  //   async sendUserResetPassword(job: Job<User>) {
  //     const user = job.data;

  //     const { webUrl } = this.configService.get('app');
  //     const { resetPasswordTokenExpiresIn } = this.configService.get('token');

  //     const url = `${webUrl}/api/v1/reset-password/${user.resetToken}`;
  //     const expiresIn = ms(ms(resetPasswordTokenExpiresIn), { long: true });

  //     await this.mailerService.sendMail({
  //       to: user.email,
  //       subject: 'Password Reset',
  //       template: 'reset-password.hbs',
  //       context: {
  //         url,
  //         expiresIn,
  //       },
  //     });
  //   }
}
