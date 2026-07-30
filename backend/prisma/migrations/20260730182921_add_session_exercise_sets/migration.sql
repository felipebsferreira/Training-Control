-- CreateTable
CREATE TABLE `SessionExercise` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `workoutLogId` INTEGER NOT NULL,
    `exerciseId` INTEGER NOT NULL,
    `load` DOUBLE NULL,
    `loadUnit` VARCHAR(191) NOT NULL DEFAULT 'kg',

    UNIQUE INDEX `SessionExercise_workoutLogId_exerciseId_key`(`workoutLogId`, `exerciseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SessionSet` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sessionExerciseId` INTEGER NOT NULL,
    `setNumber` INTEGER NOT NULL,
    `reps` INTEGER NOT NULL,

    UNIQUE INDEX `SessionSet_sessionExerciseId_setNumber_key`(`sessionExerciseId`, `setNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SessionExercise` ADD CONSTRAINT `SessionExercise_workoutLogId_fkey` FOREIGN KEY (`workoutLogId`) REFERENCES `WorkoutLog`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SessionExercise` ADD CONSTRAINT `SessionExercise_exerciseId_fkey` FOREIGN KEY (`exerciseId`) REFERENCES `Exercise`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SessionSet` ADD CONSTRAINT `SessionSet_sessionExerciseId_fkey` FOREIGN KEY (`sessionExerciseId`) REFERENCES `SessionExercise`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
