-- CreateEnum
CREATE TYPE "public"."Frequency" AS ENUM ('DAILY', 'BIWEEKLY', 'MONTHLY');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "kindeId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Preference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "frequency" "public"."Frequency" NOT NULL DEFAULT 'DAILY',
    "topics" TEXT,
    "lastSentAt" TIMESTAMP(3),
    "nextSendAt" TIMESTAMP(3),
    "paused" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Preference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Issue" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "metaJson" TEXT,
    "subject" TEXT NOT NULL DEFAULT '',
    "topics" TEXT,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Delivery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subject" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL,
    "error" TEXT,
    "toEmail" TEXT,
    "toName" TEXT,
    "topics" TEXT,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_kindeId_key" ON "public"."User"("kindeId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "public"."User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Preference_userId_key" ON "public"."Preference"("userId");

-- CreateIndex
CREATE INDEX "Preference_nextSendAt_idx" ON "public"."Preference"("nextSendAt");

-- CreateIndex
CREATE INDEX "Issue_createdAt_idx" ON "public"."Issue"("createdAt");

-- CreateIndex
CREATE INDEX "Delivery_userId_createdAt_idx" ON "public"."Delivery"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Delivery_issueId_createdAt_idx" ON "public"."Delivery"("issueId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."Preference" ADD CONSTRAINT "Preference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Delivery" ADD CONSTRAINT "Delivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Delivery" ADD CONSTRAINT "Delivery_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "public"."Issue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
