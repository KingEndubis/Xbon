import { Body, Controller, NotFoundException, Post } from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator'
import { v4 as uuidv4 } from 'uuid'

export interface User {
  id: string
  name: string
  email: string
  passwordHash: string // plain for demo only
  profileType?: 'broker' | 'principal' | 'seller' | 'introducer' | 'buyer'
}

export interface Invite {
  token: string
  inviterUserId: string
  inviteeEmail: string
  used: boolean
}

@Injectable()
export class UsersService {
  private users: User[] = []
  private tokens = new Map<string, string>() // token -> userId

  findByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  }
  findById(id: string): User | undefined {
    return this.users.find((u) => u.id === id)
  }
  create(name: string, email: string, password: string): User {
    if (this.findByEmail(email)) throw new Error('Email already registered')
    const user: User = { id: uuidv4(), name, email, passwordHash: password }
    this.users.push(user)
    return user
  }
  updateProfile(userId: string, profileType: 'broker' | 'principal' | 'seller' | 'introducer' | 'buyer'): User {
    const user = this.findById(userId)
    if (!user) throw new NotFoundException('User not found')
    user.profileType = profileType
    return user
  }
  issueToken(userId: string): string {
    const token = uuidv4()
    this.tokens.set(token, userId)
    return token
  }
  verifyToken(token: string): User {
    const userId = this.tokens.get(token)
    if (!userId) throw new NotFoundException('Invalid token')
    const user = this.findById(userId)
    if (!user) throw new NotFoundException('User not found')
    return user
  }
}

@Injectable()
export class InvitesService {
  private invites: Invite[] = []
  constructor(private usersService: UsersService) {}

  create(inviterEmail: string, inviteeEmail: string): Invite {
    const inviter = this.usersService.findByEmail(inviterEmail)
    if (!inviter) throw new NotFoundException('Inviter must be an existing member')
    const token = uuidv4()
    const invite: Invite = { token, inviterUserId: inviter.id, inviteeEmail, used: false }
    this.invites.push(invite)
    return invite
  }

  use(token: string, name: string, email: string, password: string): { user: User; token: string } {
    const invite = this.invites.find((i) => i.token === token)
    if (!invite || invite.used) throw new NotFoundException('Invalid or used invite')
    if (invite.inviteeEmail.toLowerCase() !== email.toLowerCase()) {
      throw new NotFoundException('Invite not issued for this email')
    }
    const user = this.usersService.create(name, email, password)
    invite.used = true
    const authToken = this.usersService.issueToken(user.id)
    return { user, token: authToken }
  }
}

class LoginDto {
  @IsEmail()
  email!: string
  @IsString()
  @MinLength(3)
  password!: string
}

class InviteCreateDto {
  @IsEmail()
  inviterEmail!: string
  @IsEmail()
  inviteeEmail!: string
}

class RegisterByInviteDto {
  @IsString()
  @IsNotEmpty()
  token!: string
  @IsString()
  @IsNotEmpty()
  name!: string
  @IsEmail()
  email!: string
  @IsString()
  @MinLength(3)
  password!: string
}

class UpdateProfileDto {
  @IsString()
  @IsNotEmpty()
  userId!: string
  @IsString()
  @IsNotEmpty()
  profileType!: 'broker' | 'principal' | 'seller' | 'introducer' | 'buyer'
}

@Controller('auth')
export class AuthController {
  constructor(private users: UsersService, private invites: InvitesService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    const user = this.users.findByEmail(dto.email)
    if (!user || user.passwordHash !== dto.password) {
      throw new NotFoundException('Invalid credentials')
    }
    const token = this.users.issueToken(user.id)
    return { token, user: { id: user.id, name: user.name, email: user.email, profileType: user.profileType } }
  }

  @Post('register-by-invite')
  registerByInvite(@Body() dto: RegisterByInviteDto) {
    const { user, token } = this.invites.use(dto.token, dto.name, dto.email, dto.password)
    return { token, user: { id: user.id, name: user.name, email: user.email, profileType: user.profileType } }
  }

  @Post('update-profile')
  updateProfile(@Body() dto: UpdateProfileDto) {
    const user = this.users.updateProfile(dto.userId, dto.profileType)
    const token = this.users.issueToken(user.id)
    return { token, user: { id: user.id, name: user.name, email: user.email, profileType: user.profileType } }
  }
}

@Controller('invites')
export class InvitesController {
  constructor(private invites: InvitesService) {}

  @Post()
  create(@Body() dto: InviteCreateDto) {
    const invite = this.invites.create(dto.inviterEmail, dto.inviteeEmail)
    return { token: invite.token, url: `${process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'}/?invite=${invite.token}` }
  }
}