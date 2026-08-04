-- CreateEnum
CREATE TYPE "Role" AS ENUM ('TEACHER', 'PORTAL');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('present', 'excused', 'unexcused', 'holiday');

-- CreateEnum
CREATE TYPE "PaidStatus" AS ENUM ('unpaid', 'paid', 'partially_paid');

-- CreateTable
CREATE TABLE "TeacherAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnglishClass" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "teacherName" TEXT NOT NULL,
    "pricePerSession" INTEGER NOT NULL,
    "scheduleDays" TEXT NOT NULL,
    "targetMonthSessions" INTEGER NOT NULL,
    "daysOfWeek" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "scheduleTime" TEXT,
    "room" TEXT,

    CONSTRAINT "EnglishClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "avatar" TEXT,
    "dob" TEXT,
    "parentDob" TEXT,
    "parentOccupation" TEXT,
    "futureOrientation" TEXT,
    "notes" TEXT,
    "classId" TEXT NOT NULL,
    "portalAccessCodeHash" TEXT,
    "portalAccessEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "note" TEXT,
    "lessonTopic" TEXT,
    "homework" TEXT,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TuitionBill" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "totalAttendedSessions" INTEGER NOT NULL,
    "pricePerSession" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "paidStatus" "PaidStatus" NOT NULL DEFAULT 'unpaid',
    "paidDate" TIMESTAMP(3),
    "note" TEXT,
    "receiptUrl" TEXT,

    CONSTRAINT "TuitionBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankConfig" (
    "id" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountHolder" TEXT NOT NULL,
    "centerName" TEXT NOT NULL,
    "teacherName" TEXT NOT NULL,

    CONSTRAINT "BankConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeacherAccount_email_key" ON "TeacherAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_studentId_date_key" ON "AttendanceRecord"("studentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "TuitionBill_studentId_month_key" ON "TuitionBill"("studentId", "month");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES "EnglishClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_classId_fkey" FOREIGN KEY ("classId") REFERENCES "EnglishClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TuitionBill" ADD CONSTRAINT "TuitionBill_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TuitionBill" ADD CONSTRAINT "TuitionBill_classId_fkey" FOREIGN KEY ("classId") REFERENCES "EnglishClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
