import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AgentsController, AgentsService, DealsController, DealsService } from './flows'
import { AuthController, InvitesController, InvitesService, UsersService } from './auth'

@Module({
  imports: [],
  controllers: [AppController, AgentsController, DealsController, AuthController, InvitesController],
  providers: [AppService, AgentsService, DealsService, UsersService, InvitesService],
})
export class AppModule {}
