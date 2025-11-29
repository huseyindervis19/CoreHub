/*
  Warnings:

  - You are about to drop the column `isFeatured` on the `Category` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Category" DROP COLUMN "isFeatured",
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0;
