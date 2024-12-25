import { DocumentBuilder } from '@nestjs/swagger';

export const config = new DocumentBuilder()
  .setTitle('Swagger Documentation ')
  .setDescription('The App API description')
  .setVersion('1.0')
  .build();
