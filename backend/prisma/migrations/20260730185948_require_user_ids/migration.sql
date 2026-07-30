/*
  Warnings:

  - Made the column `userId` on table `Profile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Workout` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Profile` DROP FOREIGN KEY `Profile_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Workout` DROP FOREIGN KEY `Workout_userId_fkey`;

-- DropIndex
DROP INDEX `Workout_userId_idx` ON `Workout`;

-- AlterTable
ALTER TABLE `Profile` MODIFY `userId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Workout` MODIFY `userId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Workout` ADD CONSTRAINT `Workout_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Profile` ADD CONSTRAINT `Profile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
