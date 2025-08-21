import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialAuthSchema1692000000000 implements MigrationInterface {
    name = 'InitialAuthSchema1692000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable extensions
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "citext"`);

        // Create users table
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" citext NOT NULL,
                "password" character varying(255) NOT NULL,
                "firstName" character varying(100),
                "lastName" character varying(100),
                "phone" character varying(20),
                "isVerified" boolean NOT NULL DEFAULT false,
                "isActive" boolean NOT NULL DEFAULT true,
                "isSuspended" boolean NOT NULL DEFAULT false,
                "suspensionReason" text,
                "verificationToken" character varying(255),
                "role" character varying(20) NOT NULL DEFAULT 'player',
                "provider" character varying(20),
                "providerId" character varying(255),
                "profilePicture" character varying(500),
                "lastLogin" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "CHK_user_role" CHECK ("role" IN ('player', 'venue_owner', 'admin')),
                CONSTRAINT "CHK_user_provider" CHECK ("provider" IN ('local', 'google', 'facebook'))
            )
        `);

        // Create user_preferences table
        await queryRunner.query(`
            CREATE TABLE "user_preferences" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "notificationEmail" boolean NOT NULL DEFAULT true,
                "notificationSms" boolean NOT NULL DEFAULT true,
                "notificationWhatsapp" boolean NOT NULL DEFAULT false,
                "preferredLanguage" character varying(10) NOT NULL DEFAULT 'en',
                "timezone" character varying(50) NOT NULL DEFAULT 'Asia/Karachi',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_user_preferences" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_user_preferences_user_id" UNIQUE ("userId"),
                CONSTRAINT "FK_user_preferences_user_id" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

        // Create refresh_tokens table
        await queryRunner.query(`
            CREATE TABLE "refresh_tokens" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "token" character varying(500) NOT NULL,
                "expiresAt" TIMESTAMP NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "revokedAt" TIMESTAMP,
                CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_refresh_tokens_token" UNIQUE ("token"),
                CONSTRAINT "FK_refresh_tokens_user_id" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

        // Create password_reset_tokens table
        await queryRunner.query(`
            CREATE TABLE "password_reset_tokens" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "token" character varying(255) NOT NULL,
                "expiresAt" TIMESTAMP NOT NULL,
                "used" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_password_reset_tokens" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_password_reset_tokens_token" UNIQUE ("token"),
                CONSTRAINT "FK_password_reset_tokens_user_id" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

        // Create indexes
        await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
        await queryRunner.query(`CREATE INDEX "IDX_users_role" ON "users" ("role")`);
        await queryRunner.query(`CREATE INDEX "IDX_users_is_active" ON "users" ("isActive")`);
        await queryRunner.query(`CREATE INDEX "IDX_refresh_tokens_user_id" ON "refresh_tokens" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_refresh_tokens_token" ON "refresh_tokens" ("token")`);
        await queryRunner.query(`CREATE INDEX "IDX_password_reset_tokens_token" ON "password_reset_tokens" ("token")`);

        // Create update trigger function
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW."updatedAt" = NOW();
                RETURN NEW;
            END;
            $$ language 'plpgsql'
        `);

        // Apply triggers
        await queryRunner.query(`CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`);
        await queryRunner.query(`CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON "user_preferences" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop triggers
        await queryRunner.query(`DROP TRIGGER IF EXISTS update_users_updated_at ON "users"`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON "user_preferences"`);
        
        // Drop function
        await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column()`);
        
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_password_reset_tokens_token"`);
        await queryRunner.query(`DROP INDEX "IDX_refresh_tokens_token"`);
        await queryRunner.query(`DROP INDEX "IDX_refresh_tokens_user_id"`);
        await queryRunner.query(`DROP INDEX "IDX_users_is_active"`);
        await queryRunner.query(`DROP INDEX "IDX_users_role"`);
        await queryRunner.query(`DROP INDEX "IDX_users_email"`);
        
        // Drop tables
        await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
        await queryRunner.query(`DROP TABLE "user_preferences"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }
}