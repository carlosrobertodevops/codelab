// import { PrismaClient, CourseDifficulty } from "../src/generated/prisma";
// import fs from "node:fs";
// import path from "node:path";

// type SampleLesson = {
//   title: string;
//   description?: string | null;
//   durationInMs: number;
//   videoUrl?: string | null;
// };

// type SampleCourseModule = {
//   title: string;
//   description?: string | null;
//   lessons: SampleLesson[];
// };

// type SampleCourse = {
//   title: string;
//   slug: string;
//   shortDescription?: string | null;
//   description?: string | null;
//   thumbnail: string;
//   difficulty?: string | null;
//   tags: string[];
//   modules: SampleCourseModule[];
// };

// const prisma = new PrismaClient();

// function loadSampleCourses(): SampleCourse[] {
//   const jsonPath = path.join(__dirname, "sample-courses.json");
//   const raw = fs.readFileSync(jsonPath, "utf-8");
//   const parsed = JSON.parse(raw) as unknown;

//   if (!Array.isArray(parsed)) {
//     throw new Error("sample-courses.json inválido: esperado um array de cursos.");
//   }

//   return parsed as SampleCourse[];
// }

// function nonEmptyString(value: unknown, fallback = ""): string {
//   if (typeof value !== "string") return fallback;
//   const v = value.trim();
//   return v.length ? v : fallback;
// }

// function toDifficulty(value: unknown): CourseDifficulty {
//   const v = typeof value === "string" ? value.trim().toUpperCase() : "";
//   switch (v) {
//     case "BEGINNER":
//       return CourseDifficulty.BEGINNER;
//     case "INTERMEDIATE":
//       return CourseDifficulty.INTERMEDIATE;
//     case "ADVANCED":
//       return CourseDifficulty.ADVANCED;
//     default:
//       return CourseDifficulty.BEGINNER;
//   }
// }

// async function main() {
//   console.log("🌱 Running Prisma seed...");

//   const sampleCourses = loadSampleCourses();

//   for (const course of sampleCourses) {
//     const tags = Array.isArray(course.tags) ? course.tags : [];
//     const modules = Array.isArray(course.modules) ? course.modules : [];

//     const title = nonEmptyString(course.title, "Curso");
//     const slug = nonEmptyString(
//       course.slug,
//       title.toLowerCase().replace(/\s+/g, "-")
//     );
//     const thumbnail = nonEmptyString(course.thumbnail, "https://placehold.co/600x400");

//     // Campos obrigatórios no seu schema: string (não-null)
//     const description = nonEmptyString(course.description, "");
//     const shortDescription = course.shortDescription ?? null;

//     const difficulty = toDifficulty(course.difficulty);

//     await prisma.course.upsert({
//       where: { slug },
//       update: {
//         title,
//         shortDescription,
//         description, // string
//         thumbnail,
//         difficulty // enum
//       },
//       create: {
//         title,
//         slug,
//         shortDescription,
//         description, // string
//         thumbnail,
//         difficulty, // enum

//         tags: {
//           connectOrCreate: tags.map((name: string) => ({
//             where: { name },
//             create: { name }
//           }))
//         },

//         modules: {
//           create: modules.map((courseModule: SampleCourseModule, index: number) => {
//             const moduleTitle = nonEmptyString(courseModule.title, `Módulo ${index + 1}`);
//             const moduleDescription = nonEmptyString(courseModule.description, "");

//             const lessons = Array.isArray(courseModule.lessons)
//               ? courseModule.lessons
//               : [];

//             return {
//               title: moduleTitle,
//               description: moduleDescription, // string
//               order: index,
//               lessons: {
//                 create: lessons.map((lesson: SampleLesson, lessonIndex: number) => {
//                   const lessonTitle = nonEmptyString(lesson.title, `Aula ${lessonIndex + 1}`);
//                   const lessonDescription = nonEmptyString(lesson.description, "");

//                   const videoUrl =
//                     typeof lesson.videoUrl === "string" && lesson.videoUrl.trim().length
//                       ? lesson.videoUrl.trim()
//                       : null;

//                   return {
//                     title: lessonTitle,
//                     description: lessonDescription,
//                     durationInMs: Number.isFinite(lesson.durationInMs) ? lesson.durationInMs : 0,
//                     videoUrl,
//                     order: lessonIndex
//                   };
//                 })
//               }
//             };
//           })
//         }
//       }
//     });

//     console.log(`✅ Seeded course: ${slug}`);
//   }

//   console.log("🌱 Seed finished successfully.");
// }

// main()
//   .then(async () => {
//     await prisma.$disconnect();
//   })
//   .catch(async (e) => {
//     console.error("❌ Seed error:", e);
//     await prisma.$disconnect();
//     process.exit(1);
//   });

import {
  PrismaClient,
  CourseDifficulty,
  CourseStatus,
} from '@/generated/prisma'
import sampleCourses from './sample-courses.json'

type SampleLesson = {
  title: string
  description: string
  videoId: string
  durationInMs: number
}

type SampleModule = {
  title: string
  description: string
  lessons: SampleLesson[]
}

type SampleCourse = {
  title: string
  slug: string
  shortDescription?: string | null
  description: string
  thumbnail: string
  price: number
  discountPrice?: number | null
  tags: string[]
  modules: SampleModule[]
  difficulty?: keyof typeof CourseDifficulty | CourseDifficulty | null
}

const prisma = new PrismaClient()

function normalizeDifficulty(
  input: SampleCourse['difficulty']
): CourseDifficulty {
  if (!input) return CourseDifficulty.EASY

  // Se vier como string (ex.: "EASY")
  if (typeof input === 'string') {
    const upper = input.toUpperCase()
    if (upper in CourseDifficulty)
      return CourseDifficulty[upper as keyof typeof CourseDifficulty]
  }

  // Se vier como enum
  return input as CourseDifficulty
}

async function main() {
  const courses = sampleCourses as unknown as SampleCourse[]

  // Limpa dados de cursos (ordem respeitando FKs)
  await prisma.completedLesson.deleteMany()
  await prisma.lessonComment.deleteMany()
  await prisma.coursePurchase.deleteMany()
  await prisma.courseLesson.deleteMany()
  await prisma.courseModule.deleteMany()
  await prisma.courseTag.deleteMany()
  await prisma.course.deleteMany()

  for (const course of courses) {
    const difficulty = normalizeDifficulty(course.difficulty)

    await prisma.course.create({
      data: {
        status: CourseStatus.PUBLISHED,
        title: course.title,
        slug: course.slug,
        shortDescription: course.shortDescription ?? null,
        description: course.description ?? '', // obrigatório no schema
        thumbnail: course.thumbnail,
        price: course.price,
        discountPrice: course.discountPrice ?? null,
        difficulty,

        tags: {
          create: course.tags.map((tagName: string) => ({
            name: tagName,
          })),
        },

        modules: {
          create: course.modules.map(
            (m: SampleModule, moduleIndex: number) => ({
              title: m.title,
              description: m.description ?? '', // obrigatório no schema
              order: moduleIndex + 1,
              lessons: {
                create: m.lessons.map(
                  (l: SampleLesson, lessonIndex: number) => ({
                    title: l.title,
                    description: l.description ?? '', // obrigatório no schema
                    videoId: l.videoId,
                    durationInMs: l.durationInMs,
                    order: lessonIndex + 1,
                  })
                ),
              },
            })
          ),
        },
      },
    })
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
