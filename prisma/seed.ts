import { PrismaClient, CourseDifficulty } from "../src/generated/prisma";
import fs from "node:fs";
import path from "node:path";

type SampleLesson = {
  title: string;
  description?: string | null;
  durationInMs: number;
  videoUrl?: string | null;
};

type SampleCourseModule = {
  title: string;
  description?: string | null;
  lessons: SampleLesson[];
};

type SampleCourse = {
  title: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  thumbnail: string;
  difficulty?: string | null;
  tags: string[];
  modules: SampleCourseModule[];
};

const prisma = new PrismaClient();

function loadSampleCourses(): SampleCourse[] {
  const jsonPath = path.join(__dirname, "sample-courses.json");
  const raw = fs.readFileSync(jsonPath, "utf-8");
  const parsed = JSON.parse(raw) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("sample-courses.json inválido: esperado um array de cursos.");
  }

  return parsed as SampleCourse[];
}

function nonEmptyString(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  const v = value.trim();
  return v.length ? v : fallback;
}

function toDifficulty(value: unknown): CourseDifficulty {
  const v = typeof value === "string" ? value.trim().toUpperCase() : "";
  switch (v) {
    case "BEGINNER":
      return CourseDifficulty.BEGINNER;
    case "INTERMEDIATE":
      return CourseDifficulty.INTERMEDIATE;
    case "ADVANCED":
      return CourseDifficulty.ADVANCED;
    default:
      return CourseDifficulty.BEGINNER;
  }
}

async function main() {
  console.log("🌱 Running Prisma seed...");

  const sampleCourses = loadSampleCourses();

  for (const course of sampleCourses) {
    const tags = Array.isArray(course.tags) ? course.tags : [];
    const modules = Array.isArray(course.modules) ? course.modules : [];

    const title = nonEmptyString(course.title, "Curso");
    const slug = nonEmptyString(
      course.slug,
      title.toLowerCase().replace(/\s+/g, "-")
    );
    const thumbnail = nonEmptyString(course.thumbnail, "https://placehold.co/600x400");

    // Campos obrigatórios no seu schema: string (não-null)
    const description = nonEmptyString(course.description, "");
    const shortDescription = course.shortDescription ?? null;

    const difficulty = toDifficulty(course.difficulty);

    await prisma.course.upsert({
      where: { slug },
      update: {
        title,
        shortDescription,
        description, // string
        thumbnail,
        difficulty // enum
      },
      create: {
        title,
        slug,
        shortDescription,
        description, // string
        thumbnail,
        difficulty, // enum

        tags: {
          connectOrCreate: tags.map((name: string) => ({
            where: { name },
            create: { name }
          }))
        },

        modules: {
          create: modules.map((courseModule: SampleCourseModule, index: number) => {
            const moduleTitle = nonEmptyString(courseModule.title, `Módulo ${index + 1}`);
            const moduleDescription = nonEmptyString(courseModule.description, "");

            const lessons = Array.isArray(courseModule.lessons)
              ? courseModule.lessons
              : [];

            return {
              title: moduleTitle,
              description: moduleDescription, // string
              order: index,
              lessons: {
                create: lessons.map((lesson: SampleLesson, lessonIndex: number) => {
                  const lessonTitle = nonEmptyString(lesson.title, `Aula ${lessonIndex + 1}`);
                  const lessonDescription = nonEmptyString(lesson.description, "");

                  const videoUrl =
                    typeof lesson.videoUrl === "string" && lesson.videoUrl.trim().length
                      ? lesson.videoUrl.trim()
                      : null;

                  return {
                    title: lessonTitle,
                    description: lessonDescription,
                    durationInMs: Number.isFinite(lesson.durationInMs) ? lesson.durationInMs : 0,
                    videoUrl,
                    order: lessonIndex
                  };
                })
              }
            };
          })
        }
      }
    });

    console.log(`✅ Seeded course: ${slug}`);
  }

  console.log("🌱 Seed finished successfully.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
