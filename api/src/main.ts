import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { BoardService } from './modules/board/board.service';
import { AuthService } from './modules/auth/auth.service';
import { UserService } from './modules/user/user.service';
import { UserRole, UserStatus } from './modules/user/user.entity';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 全局前缀
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 全局异常过滤器
  app.useGlobalFilters(new GlobalExceptionFilter());

  // 静态文件服务
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 服务已启动: http://localhost:${port}/api`);

  void seedData(app);
}

async function seedData(app: NestExpressApplication) {
  try {
    // 创建默认板块
    const boardService = app.get(BoardService);
    await boardService.seedDefaultBoards();

    // 创建管理员账号
    const userService = app.get(UserService);
    const authService = app.get(AuthService);

    const adminExists = await userService.findByStudentNo('admin');
    if (!adminExists) {
      const passwordHash = await authService.hashPassword('adminyuan');
      await userService.create({
        studentNo: 'admin',
        username: '系统管理员',
        passwordHash,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        isFirstLogin: true,
      });
      console.log('✅ 管理员账号已创建: admin / adminyuan');
    }

    console.log('✅ 种子数据初始化完成');
  } catch (error) {
    console.error('种子数据初始化失败:', error);
  }
}

bootstrap().catch((error) => {
  console.error('应用启动失败:', error);
  process.exit(1);
});
