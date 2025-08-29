import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator'
import { v4 as uuidv4 } from 'uuid'

export interface User {
  id: string
  name: string
  email: string
  passwordHash: string // plain for demo only
  profileType?: 'introducer' | 'broker' | 'mandate' | 'principal_buyer' | 'principal_seller'
}

export interface Invite {
  id: string;
  email: string;
  role: 'introducer' | 'broker' | 'mandate' | 'principal_buyer' | 'principal_seller';
  invitedBy: string;
  invitedByName: string;
  dealId?: string; // Optional: invite specifically for a deal
  createdAt: string;
  used: boolean;
  exclusiveAccess: boolean;
}

@Injectable()
export class UsersService {
  private users: User[] = [
    // Initial hardcoded account
    {
      id: 'initial-admin-001',
      name: 'King Endubis',
      email: 'king.endubis@xbon.com',
      passwordHash: '761Kennedy!',
      profileType: 'principal_buyer'
    }
  ]
  private tokens = new Map<string, string>() // token -> userId

  findByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  }
  findByEmailOrName(emailOrName: string): User | undefined {
    const search = emailOrName.toLowerCase()
    return this.users.find((u) => 
      u.email.toLowerCase() === search || u.name.toLowerCase() === search
    )
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
  updateProfile(userId: string, profileType: 'introducer' | 'broker' | 'mandate' | 'principal_buyer' | 'principal_seller'): User {
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

  create(invitedBy: string, invitedByName: string, email: string, role: 'principal' | 'agent' | 'introducer', dealId?: string): Invite {
    const invite: Invite = {
      id: uuidv4(),
      email,
      role,
      invitedBy,
      invitedByName,
      dealId,
      createdAt: new Date().toISOString(),
      used: false,
      exclusiveAccess: true
    }
    this.invites.push(invite)
    return invite
  }

  findByToken(token: string): Invite | undefined {
    return this.invites.find(i => i.id === token && !i.used)
  }

  findByEmail(email: string): Invite | undefined {
    return this.invites.find(i => i.email === email && !i.used)
  }

  markUsed(token: string): void {
    const invite = this.findByToken(token)
    if (invite) {
      invite.used = true
    }
  }

  list(): Invite[] {
    return this.invites
  }

  use(token: string, name: string, email: string, password: string): { user: User; token: string } {
    const invite = this.invites.find((i) => i.id === token)
    if (!invite || invite.used) throw new NotFoundException('Invalid or used invite')
    if (invite.email.toLowerCase() !== email.toLowerCase()) {
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
  email!: string

  @IsIn(['introducer', 'broker', 'mandate', 'principal_buyer', 'principal_seller'])
  role!: 'introducer' | 'broker' | 'mandate' | 'principal_buyer' | 'principal_seller'

  @IsOptional()
  @IsString()
  dealId?: string

  @IsString()
  @IsNotEmpty()
  invitedBy!: string

  @IsString()
  @IsNotEmpty()
  invitedByName!: string
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
  profileType!: 'introducer' | 'broker' | 'mandate' | 'principal_buyer' | 'principal_seller'
}

@Controller('auth')
export class AuthController {
  constructor(private users: UsersService, private invites: InvitesService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    const user = this.users.findByEmailOrName(dto.email)
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
  constructor(private readonly invites: InvitesService) {}

  @Post()
  create(@Body() body: InviteCreateDto) {
    return this.invites.create(body.invitedBy, body.invitedByName, body.email, body.role, body.dealId)
  }

  @Get()
  list() {
    return this.invites.list()
  }

  @Get(':token')
  getByToken(@Param('token') token: string) {
    const invite = this.invites.findByToken(token)
    if (!invite) throw new NotFoundException('Invite not found')
    return invite
  }
}