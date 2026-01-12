import { PrismaClient } from "../src/generated/prisma";
import sampleCourses from "./sample-courses.json";

type SampleCourseLesson = {
  title: string;
  description: string;
  durationInMs: number;
  videoId: string;
};

type SampleCourseModule = {
  title: string;
  description: string;
  lessons: SampleCourseLesson[];
};

type SampleCourse = {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnail: string;
  priceInCents: number;
  tags: string[];
  modules: SampleCourseModule[];
};

const prisma = new PrismaClient();
const courses = sampleCourses as unknown as SampleCourse[];

async function main() {
  console.log("🌱 Seeding database...");

  for (const courseData of courses) {
    const { tags, modules, ...course } = courseData;

    await prisma.course.upsert({
      where: { slug: course.slug },
      update: {
        title: course.title,
        shortDescription: course.shortDescription,
        description: course.description,
        thumbnail: course.thumbnail,
        priceInCents: course.priceInCents,
        status: "PUBLISHED"
      },
      create: {
        ...course,
        status: "PUBLISHED",
        tags: {
          connectOrCreate: tags.map((name: string) => ({
            where: { name },
            create: { name }
          }))
        },
        modules: {
          create: modules.map((courseModule: SampleCourseModule, index: number) => ({
            title: courseModule.title,
            description: courseModule.description,
            order: index,
            lessons: {
              create: courseModule.lessons.map((lesson: SampleCourseLesson, lessonIndex: number) => ({
                title: lesson.title,
                description: lesson.description,
                durationInMs: lesson.durationInMs,
                videoId: lesson.videoId,
                order: lessonIndex
              }))
            }
          }))
        }
      }
    });

    console.log(`✅ Seeded course: ${course.slug}`);
  }

  console.log("🌱 Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
