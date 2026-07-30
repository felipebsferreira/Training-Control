-- Rename `performedAt` to `startedAt` and add nullable `finishedAt`, preserving
-- existing rows: legacy single-timestamp logs become zero-duration completed
-- sessions (startedAt = finishedAt = old performedAt) rather than being lost
-- or misread as still in progress.

ALTER TABLE `WorkoutLog` ADD COLUMN `startedAt` DATETIME(3) NULL;
ALTER TABLE `WorkoutLog` ADD COLUMN `finishedAt` DATETIME(3) NULL;

UPDATE `WorkoutLog` SET `startedAt` = `performedAt`, `finishedAt` = `performedAt`;

ALTER TABLE `WorkoutLog` MODIFY `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

DROP INDEX `WorkoutLog_performedAt_idx` ON `WorkoutLog`;
ALTER TABLE `WorkoutLog` DROP COLUMN `performedAt`;

CREATE INDEX `WorkoutLog_startedAt_idx` ON `WorkoutLog`(`startedAt`);
CREATE INDEX `WorkoutLog_finishedAt_idx` ON `WorkoutLog`(`finishedAt`);
