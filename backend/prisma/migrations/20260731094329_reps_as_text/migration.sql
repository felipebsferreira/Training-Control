-- Reps become free text (e.g. "15+10+8" for Drop Set) instead of a single
-- integer. Existing integer values convert to their string form in place.
ALTER TABLE `ExerciseSet` MODIFY COLUMN `reps` VARCHAR(100) NOT NULL;
ALTER TABLE `SessionSet` MODIFY COLUMN `reps` VARCHAR(100) NOT NULL;
