-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable: Workout gets a nullable userId for now (backfilled in the next step)
ALTER TABLE `Workout` ADD COLUMN `userId` INTEGER NULL;
CREATE INDEX `Workout_userId_idx` ON `Workout`(`userId`);
ALTER TABLE `Workout` ADD CONSTRAINT `Workout_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Profile gets a nullable, unique userId for now (backfilled in the next step)
ALTER TABLE `Profile` ADD COLUMN `userId` INTEGER NULL;
CREATE UNIQUE INDEX `Profile_userId_key` ON `Profile`(`userId`);
ALTER TABLE `Profile` ADD CONSTRAINT `Profile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
