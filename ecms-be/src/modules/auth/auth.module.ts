import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PassportModule, JwtModule.register({}), NotificationsModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AuthGuard, RolesGuard],
  exports: [AuthGuard, RolesGuard, AuthService],
})
export class AuthModule {}
