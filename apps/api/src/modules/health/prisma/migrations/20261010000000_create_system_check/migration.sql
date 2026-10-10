-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "health";

-- CreateTable
CREATE TABLE "health"."system_check" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "status" TEXT NOT NULL,
    "checked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_check_pkey" PRIMARY KEY ("id")
);
