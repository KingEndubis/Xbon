import { Body, Controller, Get, Injectable, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { IsArray, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { Type } from 'class-transformer';

export type DealStatus = 'initiated' | 'kYC' | 'contracted' | 'inspection' | 'payment' | 'shipped' | 'closed' | 'cancelled';
export type Commodity = 'gold' | 'silver' | 'oil' | 'diamond'
export type Exclusivity = 'standard' | 'exclusive' | 'premier'

export class CreateAgentDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  parentAgentId?: string;
}

export interface Agent {
  id: string;
  name: string;
  parentAgentId?: string;
}

export class CreateDealDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsIn(['gold', 'silver', 'oil', 'diamond'])
  @IsString()
  commodity!: Commodity;

  @IsIn(['standard', 'exclusive', 'premier'])
  @IsString()
  exclusivity!: Exclusivity;

  @IsNumber()
  quantityKg!: number;

  @IsNumber()
  pricePerKg!: number;

  @IsString()
  @IsNotEmpty()
  location!: string;

  @IsString()
  @IsOptional()
  details?: string; // will be encrypted

  @IsArray()
  @IsString({ each: true })
  participants!: string[]; // agent ids in chain order (buyer/seller/brokers)
}

export class UpdateStatusDto {
  @IsString()
  @IsNotEmpty()
  status!: DealStatus;
}

export class UploadDocumentDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsString()
  @IsOptional()
  category?: 'mandate' | 'contract' | 'certificate' | 'proof_of_funds' | 'other';

  @IsString()
  @IsNotEmpty()
  content!: string; // base64 encoded file content

  @IsString()
  @IsNotEmpty()
  uploadedBy!: string;
}

export class JoinDealDto {
  @IsString()
  @IsNotEmpty()
  inviteCode!: string;

  @IsString()
  @IsNotEmpty()
  agentId!: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  category?: 'mandate' | 'contract' | 'certificate' | 'proof_of_funds' | 'other';
  uploadedAt: string;
  uploadedBy: string;
  encryptedContent?: string;
  iv?: string;
  aiVerificationStatus?: 'pending' | 'verified' | 'rejected' | 'redacted';
  redactedContent?: string; // AI-redacted version
  originalPrincipalInfo?: string; // encrypted original info that AI identified
}

export interface Deal {
  id: string;
  title: string;
  commodity: Commodity;
  exclusivity: Exclusivity;
  quantityKg: number;
  pricePerKg: number;
  location: string;
  encryptedDetails?: string; // base64
  iv?: string; // base64
  chain: string[]; // agent ids in order
  status: DealStatus;
  history: { status: DealStatus; at: string }[];
  documents: Document[];
  inviteLink?: string;
  createdAt: string;
  createdBy: string;
}

@Injectable()
export class AgentsService {
  private agents: Agent[] = [];

  create(dto: CreateAgentDto): Agent {
    const agent: Agent = { id: uuidv4(), name: dto.name, parentAgentId: dto.parentAgentId };
    this.agents.push(agent);
    return agent;
  }

  list(): Agent[] {
    return this.agents;
  }

  get(id: string): Agent {
    const a = this.agents.find(x => x.id === id);
    if (!a) throw new NotFoundException('Agent not found');
    return a;
  }
}

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || '';
  if (!key) {
    // Derive a deterministic dev key to avoid crashes (not for production)
    return crypto.createHash('sha256').update('dev-key').digest();
  }
  // Expect hex or base64; normalize to 32-byte key
  try {
    const b = Buffer.from(key, 'base64');
    if (b.length === 32) return b;
  } catch {}
  try {
    const b = Buffer.from(key, 'hex');
    if (b.length === 32) return b;
  } catch {}
  return crypto.createHash('sha256').update(key).digest();
}

function encrypt(text?: string): { cipher?: string; iv?: string } {
  if (!text) return {};
  const iv = crypto.randomBytes(12);
  const key = getKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { cipher: Buffer.concat([enc, tag]).toString('base64'), iv: iv.toString('base64') };
}

@Injectable()
export class DealsService {
  private deals: Deal[] = [];

  create(dto: CreateDealDto, createdBy: string): Deal {
    const id = uuidv4();
    const { cipher, iv } = encrypt(dto.details);
    const now = new Date().toISOString();
    const inviteCode = crypto.randomBytes(16).toString('hex');
    const deal: Deal = {
      id,
      title: dto.title,
      commodity: dto.commodity,
      exclusivity: dto.exclusivity,
      quantityKg: dto.quantityKg,
      pricePerKg: dto.pricePerKg,
      location: dto.location,
      encryptedDetails: cipher,
      iv,
      chain: dto.participants,
      status: 'initiated',
      history: [{ status: 'initiated', at: now }],
      documents: [],
      inviteLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/join-deal/${inviteCode}`,
      createdAt: now,
      createdBy,
    };
    this.deals.push(deal);
    return deal;
  }

  list(): Deal[] { return this.deals; }

  get(id: string): Deal {
    const d = this.deals.find(x => x.id === id);
    if (!d) throw new NotFoundException('Deal not found');
    return d;
  }

  updateStatus(id: string, status: DealStatus): Deal {
    const d = this.get(id);
    d.status = status;
    d.history.push({ status, at: new Date().toISOString() });
    return d;
  }

  uploadDocument(dealId: string, dto: UploadDocumentDto): Deal {
    const deal = this.get(dealId);
    const { cipher, iv } = encrypt(dto.content);
    const document: Document = {
      id: uuidv4(),
      name: dto.name,
      type: dto.type,
      category: dto.category,
      uploadedAt: new Date().toISOString(),
      uploadedBy: dto.uploadedBy,
      encryptedContent: cipher,
      iv,
      aiVerificationStatus: 'pending',
    };
    
    // Simulate AI verification for mandate documents
    if (dto.category === 'mandate') {
      // In real implementation, this would call an AI service
      setTimeout(() => {
        this.verifyMandateDocument(dealId, document.id);
      }, 2000); // Simulate processing time
    }
    
    deal.documents.push(document);
    return deal;
  }

  private verifyMandateDocument(dealId: string, documentId: string): void {
    const deal = this.get(dealId);
    const document = deal.documents.find(d => d.id === documentId);
    if (!document) return;

    // Simulate AI processing that identifies and redacts principal information
    const mockRedactedContent = document.encryptedContent?.replace(/[A-Z][a-z]+ [A-Z][a-z]+/g, '[PRINCIPAL NAME REDACTED]');
    const mockOriginalInfo = encrypt('John Smith - Principal Seller, ABC Mining Corp');

    document.aiVerificationStatus = 'redacted';
    document.redactedContent = mockRedactedContent;
    document.originalPrincipalInfo = mockOriginalInfo.cipher;
  }

  joinDealByInvite(dto: JoinDealDto): Deal {
    const deal = this.deals.find(d => d.inviteLink?.includes(dto.inviteCode));
    if (!deal) throw new NotFoundException('Invalid invite code');
    
    // Add agent to deal chain if not already present
    if (!deal.chain.includes(dto.agentId)) {
      deal.chain.push(dto.agentId);
    }
    
    return deal;
  }

  getDealByInviteCode(inviteCode: string): Deal {
    const deal = this.deals.find(d => d.inviteLink?.includes(inviteCode));
    if (!deal) throw new NotFoundException('Invalid invite code');
    return deal;
  }
}

@Controller('agents')
export class AgentsController {
  constructor(private readonly agents: AgentsService) {}

  @Post()
  create(@Body() body: CreateAgentDto) { return this.agents.create(body); }

  @Get()
  list() { return this.agents.list(); }

  @Get(':id')
  get(@Param('id') id: string) { return this.agents.get(id); }
}

class CreateDealBody {
  @ValidateNested()
  @Type(() => CreateDealDto)
  data!: CreateDealDto;
}

@Controller('deals')
export class DealsController {
  constructor(private readonly deals: DealsService, private readonly agents: AgentsService) {}

  @Post()
  create(@Body() body: CreateDealDto & { createdBy: string }) {
    // ensure agents exist in chain
    body.participants.forEach(id => this.agents.get(id));
    return this.deals.create(body, body.createdBy);
  }

  @Get()
  list() { return this.deals.list(); }

  @Get(':id')
  get(@Param('id') id: string) { return this.deals.get(id); }

  @Patch(':id/status')
  setStatus(@Param('id') id: string, @Body() body: UpdateStatusDto) { return this.deals.updateStatus(id, body.status); }

  @Post(':id/documents')
  uploadDocument(@Param('id') id: string, @Body() body: UploadDocumentDto) {
    return this.deals.uploadDocument(id, body);
  }

  @Post('join')
  joinDeal(@Body() body: JoinDealDto) {
    // ensure agent exists
    this.agents.get(body.agentId);
    return this.deals.joinDealByInvite(body);
  }

  @Get('invite/:code')
  getDealByInvite(@Param('code') code: string) {
    return this.deals.getDealByInviteCode(code);
  }
}