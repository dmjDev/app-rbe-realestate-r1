-- CreateEnum
CREATE TYPE "OperationType" AS ENUM ('SALE', 'RENT', 'RENT_TO_BUY', 'HOLIDAY_RENT', 'LIFE_ESTATE', 'SHARE', 'TRANSFER');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('FLAT', 'APARTMENT', 'PENTHOUSE', 'DUPLEX', 'STUDIO', 'TERRACED_HOUSES', 'DETACHED_CHALETS', 'VILLAS', 'COTTAGE', 'BUNGALOW', 'LOFT', 'ROOMS', 'COMMERCIAL_PROPERTIES', 'GARAGES', 'STORAGE_ROOMS', 'LAND', 'OFFICES', 'BUILDINGS');

-- CreateEnum
CREATE TYPE "EnergyRating" AS ENUM ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'PENDING');

-- CreateEnum
CREATE TYPE "Orientation" AS ENUM ('N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO');

-- CreateEnum
CREATE TYPE "FlooringType" AS ENUM ('HARDWOOD', 'LAMINATE', 'VINYL', 'CERAMICTILE', 'PORCELAINTILE', 'MARBLE', 'GRANITE', 'POLISHEDCONCRETE', 'TRAVERTINE', 'CARPET', 'NATURALSTONE', 'TERRAZO', 'BAMBOO');

-- CreateEnum
CREATE TYPE "FrequencyPay" AS ENUM ('DAILY', 'WEEKLY', 'FORTNIGHTLY', 'MONTHLY', 'ANNUALLY');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userRol" INTEGER NOT NULL DEFAULT 1,
    "phone" TEXT,
    "urlSearch" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER DEFAULT 0,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "itemDescription" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "itemRef" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "homePromo" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "isOwner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "operType" "OperationType" NOT NULL,
    "propType" "PropertyType" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "priceMin" DOUBLE PRECISION,
    "frequencyPay" "FrequencyPay",
    "isNewDevelopment" BOOLEAN NOT NULL DEFAULT false,
    "builtYear" INTEGER,
    "province" TEXT NOT NULL,
    "municipality" TEXT NOT NULL,
    "neighborhood" TEXT,
    "streetName" TEXT,
    "streetNumber" TEXT,
    "floor" TEXT,
    "isExterior" BOOLEAN NOT NULL DEFAULT true,
    "showAddress" BOOLEAN NOT NULL DEFAULT false,
    "orientation" "Orientation",
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "builtSize" DOUBLE PRECISION,
    "usefulSize" DOUBLE PRECISION,
    "rooms" INTEGER,
    "bathrooms" INTEGER,
    "flooringMaterial" "FlooringType",
    "hasLift" BOOLEAN NOT NULL DEFAULT false,
    "hasGarden" BOOLEAN NOT NULL DEFAULT false,
    "hasPool" BOOLEAN NOT NULL DEFAULT false,
    "hasTerrace" BOOLEAN NOT NULL DEFAULT false,
    "hasBalcony" BOOLEAN NOT NULL DEFAULT false,
    "hasStorageRoom" BOOLEAN NOT NULL DEFAULT false,
    "hasGarage" BOOLEAN NOT NULL DEFAULT false,
    "isFurnished" BOOLEAN NOT NULL DEFAULT false,
    "floatingFloor" BOOLEAN NOT NULL DEFAULT false,
    "centralHeating" BOOLEAN NOT NULL DEFAULT false,
    "underfloorHeating" BOOLEAN NOT NULL DEFAULT false,
    "ductedAirc" BOOLEAN NOT NULL DEFAULT false,
    "splitsAirc" BOOLEAN NOT NULL DEFAULT false,
    "climalitWindow" BOOLEAN NOT NULL DEFAULT false,
    "thermalBridgeWindow" BOOLEAN NOT NULL DEFAULT false,
    "electricBlinds" BOOLEAN NOT NULL DEFAULT false,
    "premiumAppliance" BOOLEAN NOT NULL DEFAULT false,
    "seaSight" BOOLEAN NOT NULL DEFAULT false,
    "mountainSight" BOOLEAN NOT NULL DEFAULT false,
    "culturalSight" BOOLEAN NOT NULL DEFAULT false,
    "commonRooms" BOOLEAN NOT NULL DEFAULT false,
    "commonPool" BOOLEAN NOT NULL DEFAULT false,
    "commonGym" BOOLEAN NOT NULL DEFAULT false,
    "padelArea" BOOLEAN NOT NULL DEFAULT false,
    "childrenArea" BOOLEAN NOT NULL DEFAULT false,
    "socialArea" BOOLEAN NOT NULL DEFAULT false,
    "goalkeeper" BOOLEAN NOT NULL DEFAULT false,
    "securityCameras" BOOLEAN NOT NULL DEFAULT false,
    "alarm" BOOLEAN NOT NULL DEFAULT false,
    "accesibility" BOOLEAN NOT NULL DEFAULT false,
    "energyRating" "EnergyRating" NOT NULL DEFAULT 'PENDING',
    "emissionsRating" "EnergyRating" NOT NULL DEFAULT 'PENDING',
    "imgUrl" JSONB,
    "videoUrl" TEXT,
    "virtualTourUrl" TEXT,
    "communityCosts" DOUBLE PRECISION,
    "annualTax" DOUBLE PRECISION,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itemssaved" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'visited',

    CONSTRAINT "itemssaved_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itemchats" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "clientId" TEXT,
    "managerId" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itemchats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "role_level_key" ON "role"("level");

-- CreateIndex
CREATE UNIQUE INDEX "role_name_key" ON "role"("name");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "items_itemRef_key" ON "items"("itemRef");

-- CreateIndex
CREATE UNIQUE INDEX "properties_itemId_key" ON "properties"("itemId");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_userRol_fkey" FOREIGN KEY ("userRol") REFERENCES "role"("level") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itemssaved" ADD CONSTRAINT "itemssaved_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itemssaved" ADD CONSTRAINT "itemssaved_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itemchats" ADD CONSTRAINT "itemchats_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itemchats" ADD CONSTRAINT "itemchats_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itemchats" ADD CONSTRAINT "itemchats_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
