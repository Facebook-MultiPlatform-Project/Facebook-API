import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Modules } from 'src/module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from './helper/interceptors/transform-response.interceptor';
import { FirebaseModule } from './modules/firebase/firebase.module';

@Module({
  imports: Modules,
  controllers: [AppController],
  providers: [AppService, 
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    }],
})
export class AppModule {}
