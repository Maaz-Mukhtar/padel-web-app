import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialUserSchema1692000000001 implements MigrationInterface {
    name = 'InitialUserSchema1692000000001';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable extensions
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "citext"`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "postgis"`);

        // Create user_profiles table
        await queryRunner.query(`
            CREATE TABLE "user_profiles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "bio" text,
                "skillLevel" character varying(20),
                "playFrequency" character varying(50),
                "preferredPlayTime" character varying(50),
                "profilePictureUrl" text,
                "achievements" jsonb DEFAULT '[]'::jsonb,
                "stats" jsonb DEFAULT '{}'::jsonb,
                "rating" decimal(3,2) NOT NULL DEFAULT '0.00',
                "totalReviews" integer NOT NULL DEFAULT '0',
                "location" geography(Point,4326),
                "city" character varying(100),
                "country" character varying(100) DEFAULT 'Pakistan',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_user_profiles" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_user_profiles_user_id" UNIQUE ("userId"),
                CONSTRAINT "CHK_user_profiles_skill_level" CHECK ("skillLevel" IN ('beginner', 'intermediate', 'advanced', 'professional')),
                CONSTRAINT "CHK_user_profiles_rating" CHECK ("rating" >= 0 AND "rating" <= 5)
            )
        `);

        // Create user_connections table
        await queryRunner.query(`
            CREATE TABLE "user_connections" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "connectedUserId" uuid NOT NULL,
                "connectionType" character varying(20) NOT NULL DEFAULT 'friend',
                "status" character varying(20) NOT NULL DEFAULT 'pending',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_user_connections" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_user_connections_unique" UNIQUE ("userId", "connectedUserId"),
                CONSTRAINT "CHK_user_connections_type" CHECK ("connectionType" IN ('friend', 'follower', 'blocked')),
                CONSTRAINT "CHK_user_connections_status" CHECK ("status" IN ('pending', 'accepted', 'rejected')),
                CONSTRAINT "CHK_user_connections_not_self" CHECK ("userId" != "connectedUserId")
            )
        `);

        // Create user_activities table
        await queryRunner.query(`
            CREATE TABLE "user_activities" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "activityType" character varying(50) NOT NULL,
                "activityData" jsonb,
                "ipAddress" inet,
                "userAgent" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_user_activities" PRIMARY KEY ("id")
            )
        `);

        // Create indexes
        await queryRunner.query(`CREATE INDEX "IDX_user_profiles_user_id" ON "user_profiles" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_user_profiles_rating" ON "user_profiles" ("rating" DESC)`);
        await queryRunner.query(`CREATE INDEX "IDX_user_profiles_location" ON "user_profiles" USING GIST("location")`);
        await queryRunner.query(`CREATE INDEX "IDX_user_connections_user_id" ON "user_connections" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_user_connections_connected_user_id" ON "user_connections" ("connectedUserId")`);
        await queryRunner.query(`CREATE INDEX "IDX_user_activities_user_id" ON "user_activities" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_user_activities_created_at" ON "user_activities" ("createdAt" DESC)`);

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
        await queryRunner.query(`CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON "user_profiles" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`);
        await queryRunner.query(`CREATE TRIGGER update_user_connections_updated_at BEFORE UPDATE ON "user_connections" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop triggers
        await queryRunner.query(`DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON "user_profiles"`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS update_user_connections_updated_at ON "user_connections"`);
        
        // Drop function
        await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column()`);
        
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_user_activities_created_at"`);
        await queryRunner.query(`DROP INDEX "IDX_user_activities_user_id"`);
        await queryRunner.query(`DROP INDEX "IDX_user_connections_connected_user_id"`);
        await queryRunner.query(`DROP INDEX "IDX_user_connections_user_id"`);
        await queryRunner.query(`DROP INDEX "IDX_user_profiles_location"`);
        await queryRunner.query(`DROP INDEX "IDX_user_profiles_rating"`);
        await queryRunner.query(`DROP INDEX "IDX_user_profiles_user_id"`);
        
        // Drop tables
        await queryRunner.query(`DROP TABLE "user_activities"`);
        await queryRunner.query(`DROP TABLE "user_connections"`);
        await queryRunner.query(`DROP TABLE "user_profiles"`);
    }
}