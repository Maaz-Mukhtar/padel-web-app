import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: 'uuid-v4-string',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+923001234567',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    description: 'User role in the system',
    example: 'player',
    enum: ['player', 'venue_owner', 'admin'],
  })
  role: string;

  @ApiProperty({
    description: 'Whether user email is verified',
    example: true,
  })
  isVerified: boolean;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2023-12-01T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-12-01T10:00:00.000Z',
  })
  updatedAt: Date;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'User information',
    type: UserResponseDto,
  })
  user: UserResponseDto;
}

export class TokenVerificationResponseDto {
  @ApiProperty({
    description: 'User ID from token',
    example: 'uuid-v4-string',
  })
  sub: string;

  @ApiProperty({
    description: 'User email from token',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User role from token',
    example: 'player',
  })
  role: string;

  @ApiProperty({
    description: 'Token issued at timestamp',
    example: 1701428400,
  })
  iat: number;

  @ApiProperty({
    description: 'Token expiration timestamp',
    example: 1701432000,
  })
  exp: number;
}