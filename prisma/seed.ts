import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type CourseDifficulty } from "@prisma/client";
import { Pool } from "pg";

// ts-node (CommonJS) + JSON via require para evitar resolveJsonModule
 
const sampleCourses = require("./sample-courses.json") as SampleCourse[];

type SampleLesson = {
  title: string;
  durationInMs: number;
  order: number;
  videoId: string;
  thumbnail: string;
  description: string;
};

type SampleModule = {
  title: string;
  order: number;
  lessons: SampleLesson[];
};

type SampleCourse = {
  title: string;
  slug: string;
  shortDescription?: string;
  description: string;
  thumbnail: string;
  price: number;
  discountPrice?: number | null;
  tags?: string[];
  modules: SampleModule[];
  difficulty?: CourseDifficulty;
};

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  for (const course of sampleCourses) {
    const tags = course.tags ?? [];

    // upsert tags
    for (const tagName of tags) {
      await prisma.courseTag.upsert({
        where: { name: tagName },
        create: { name: tagName },
        update: {},
      });
    }

    await prisma.course.upsert({
      where: { slug: course.slug },
      create: {
        title: course.title,
        slug: course.slug,
        shortDescription: course.shortDescription ?? "",
        description: course.description ?? "",
        thumbnail: course.thumbnail,
        price: course.price,
        discountPrice: course.discountPrice ?? undefined,
        difficulty: course.difficulty ?? undefined,
        tags: {
          connect: tags.map((name) => ({ name })),
        },
        modules: {
          create: course.modules
            .sort((a, b) => a.order - b.order)
            .map((m) => ({
              title: m.title,
              description: "",
              order: m.order,
              lessons: {
                create: m.lessons
                  .sort((a, b) => a.order - b.order)
                  .map((l) => ({
                    title: l.title,
                    description: l.description ?? "",
                    thumbnail: l.thumbnail,
                    videoId: l.videoId,
                    durationInMs: l.durationInMs,
                    order: l.order,
                  })),
              },
            })),
        },
      },
      update: {
        title: course.title,
        shortDescription: course.shortDescription ?? "",
        description: course.description ?? "",
        thumbnail: course.thumbnail,
        price: course.price,
        discountPrice: course.discountPrice ?? undefined,
        difficulty: course.difficulty ?? undefined,
        tags: {
          set: [],
          connect: tags.map((name) => ({ name })),
        },
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
     
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
