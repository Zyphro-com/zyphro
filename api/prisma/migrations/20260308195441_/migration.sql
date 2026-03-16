/*
  Warnings:

  - You are about to drop the column `cipherText` on the `Secret` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Switch` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `content` to the `Secret` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiresAt` to the `Secret` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Secret` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Secret` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "DmsStatus" AS ENUM ('IDLE', 'WARNING', 'TRIGGERED');

-- AlterTable
ALTER TABLE "Secret" DROP COLUMN "cipherText",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "maxViews" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "nonce" TEXT,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "password",
ADD COLUMN     "checkInInterval" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "dmsNote" TEXT,
ADD COLUMN     "dmsStatus" "DmsStatus" NOT NULL DEFAULT 'IDLE',
ADD COLUMN     "lastCheckIn" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "nextTriggerDate" TIMESTAMP(3),
ADD COLUMN     "plan" "Plan" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "recipientEmail" TEXT,
ADD COLUMN     "storageLimit" BIGINT NOT NULL DEFAULT 104857600,
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "switchEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "usedStorage" BIGINT NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "Switch";

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "requestsUsed" INTEGER NOT NULL DEFAULT 0,
    "requestsLimit" INTEGER NOT NULL DEFAULT 1000,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileVortex" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "mimeType" TEXT,
    "s3Key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "FileVortex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anon_aliases" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "alias_email" TEXT NOT NULL,
    "label" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anon_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "received_emails" (
    "id" SERIAL NOT NULL,
    "alias_id" INTEGER NOT NULL,
    "from_address" TEXT NOT NULL,
    "subject" TEXT,
    "body_html" TEXT NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "received_emails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key");

-- CreateIndex
CREATE UNIQUE INDEX "FileVortex_s3Key_key" ON "FileVortex"("s3Key");

-- CreateIndex
CREATE UNIQUE INDEX "anon_aliases_alias_email_key" ON "anon_aliases"("alias_email");

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileVortex" ADD CONSTRAINT "FileVortex_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
