-- CreateTable
CREATE TABLE "MasterProfile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "shortTitle" TEXT NOT NULL DEFAULT '',
    "coverLetterInstructions" TEXT NOT NULL DEFAULT '',
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WorkExperience" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "profileId" INTEGER NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL DEFAULT 'Present',
    "bullets" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkExperience_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "MasterProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "profileId" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    CONSTRAINT "Skill_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "MasterProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LeadershipStory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "profileId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "situation" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "LeadershipStory_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "MasterProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "jdText" TEXT NOT NULL,
    "jdLink" TEXT NOT NULL DEFAULT '',
    "company" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL DEFAULT '',
    "extractedFeatures" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ApplicationPack" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "jobId" INTEGER NOT NULL,
    "cvTitle" TEXT NOT NULL DEFAULT '',
    "cvExperiences" TEXT NOT NULL DEFAULT '[]',
    "cvSkills" TEXT NOT NULL DEFAULT '[]',
    "coverLetter" TEXT NOT NULL DEFAULT '',
    "atsScore" INTEGER NOT NULL DEFAULT 0,
    "atsReport" TEXT NOT NULL DEFAULT '{}',
    "hrEmail" TEXT NOT NULL DEFAULT '',
    "linkedinMessage" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApplicationPack_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobPosting" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationPack_jobId_key" ON "ApplicationPack"("jobId");
