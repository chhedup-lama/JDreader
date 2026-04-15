-- CreateTable
CREATE TABLE "InterviewTracker" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "company" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT '',
    "employmentType" TEXT NOT NULL DEFAULT 'full-time',
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "status" TEXT NOT NULL DEFAULT 'applied',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
