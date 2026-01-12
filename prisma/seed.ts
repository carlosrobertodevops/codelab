import fs from "node:fs";
import path from "node:path";

import { PrismaClient, CourseDifficulty, CourseStatus } from "@/generated/prisma";

type SampleLesson = {
  title: string;
  description?: string | null;
  durationInMs?: number;
  videoUrl?: string | null;
};

type SampleCourseModule = {
  title: string;
  description?: string | null;
  lessons: SampleLesson[];
};

type SampleCourse = {
  title: string;
  shortDescription?: string | null;
  description?: string | null;
  thumbnail: string;
  difficulty?: string;
  status?: string;
  tags?: string[];
  modules: SampleCourseModule[];
};

function loadSampleCourses(): SampleCourse[] {
  const filePath = path.join(__dirname, "sample-courses.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as SampleCourse[];
}

const prisma = new PrismaClient();

function normalizeDifficulty(input?: string): CourseDifficulty {
  const v = (input ?? "").toLowerCase().trim();
  if (v === "beginner") return CourseDifficulty.beginner;
  if (v === "intermediate") return CourseDifficulty.intermediate;
  if (v === "advanced") return CourseDifficulty.advanced;
  return CourseDifficulty.beginner;
}

function normalizeStatus(input?: string): CourseStatus {
  const v = (input ?? "").toLowerCase().trim();
  if (v === "draft") return CourseStatus.draft;
  if (v === "published") return CourseStatus.published;
  if (v === "archived") return CourseStatus.archived;
  return CourseStatus.draft;
}

async function main() {
  const courses = loadSampleCourses();

  for (const course of courses) {
    const tags = course.tags ?? [];
    const modules = course.modules ?? [];

    await prisma.course.upsert({
      where: { slug: course.title.toLowerCase().replace(/\s+/g, "-") },
      update: {
        title: course.title,
        shortDescription: course.shortDescription ?? "",
        description: course.description ?? "",
        thumbnail: course.thumbnail,
        difficulty: normalizeDifficulty(course.difficulty),
        status: normalizeStatus(course.status),
      },
      create: {
        title: course.title,
        slug: course.title.toLowerCase().replace(/\s+/g, "-"),
        shortDescription: course.shortDescription ?? "",
        description: course.description ?? "",
        thumbnail: course.thumbnail,
        difficulty: normalizeDifficulty(course.difficulty),
        status: normalizeStatus(course.status),
        tags: {
          connectOrCreate: tags.map((name: string) => ({
            where: { name },
            create: { name },
          })),
        },
        modules: {
          create: modules.map((courseModule: SampleCourseModule, index: number) => ({
            title: courseModule.title,
            description: courseModule.description ?? "",
            order: index,
            lessons: {
              create: (courseModule.lessons ?? []).map((lesson: SampleLesson, lessonIndex: number) => ({
                title: lesson.title,
                description: lesson.description ?? "",
                durationInMs: lesson.durationInMs ?? 0,
                videoUrl: lesson.videoUrl ?? null,
                order: lessonIndex,
              })),
            },
          })),
        },
      },
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
