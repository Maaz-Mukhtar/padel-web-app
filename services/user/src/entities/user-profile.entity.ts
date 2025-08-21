import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'enum', enum: ['beginner', 'intermediate', 'advanced', 'professional'], nullable: true })
  skillLevel: string;

  @Column({ nullable: true })
  playFrequency: string;

  @Column({ nullable: true })
  preferredPlayTime: string;

  @Column({ nullable: true })
  profilePictureUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  achievements: object;

  @Column({ type: 'jsonb', nullable: true })
  stats: object;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ default: 0 })
  totalReviews: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}