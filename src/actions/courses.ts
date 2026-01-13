"use server";

import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function getCourses() {
  return prisma.course.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCourseBySlug(slug: string) {
  return prisma.course.findUnique({
    where: { slug },
    include: { lessons: true },
  });
}

export async function getPurchasedCourses() {
  const user = await getUser();
  if (!user) return [];

  const userId = user.userId;

  const purchasedCourses = await prisma.enrollment.findMany({
    where: {
      userId,
    },
    include: {
      course: true,
    },
    orderBy: {
      enrolledAt: "desc",
    },
  });

  return purchasedCourses.map((enrollment) => enrollment.course);
}
