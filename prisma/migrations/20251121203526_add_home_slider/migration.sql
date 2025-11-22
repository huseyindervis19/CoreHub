-- CreateTable
CREATE TABLE "HomeSlider" (
    "id" SERIAL NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "ctaLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeSlider_pkey" PRIMARY KEY ("id")
);
