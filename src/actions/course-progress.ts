"use server";

import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function getCourseProgress(courseId: string) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const userId = user.id;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { lessons: true },
  });

  if (!course) throw new Error("Course not found");

  const userHasCourse = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId: course.id,
      },
    },
  });

  if (!userHasCourse) {
    return {
      completedLessons: [],
      progressPercentage: 0,
    };
  }

  const completedLessons = await prisma.completedLesson.findMany({
    where: {
      userId,
      lesson: {
        courseId,
      },
    },
  });

  const progressPercentage =
    course.lessons.length === 0
      ? 0
      : Math.round((completedLessons.length / course.lessons.length) * 100);

  return {
    completedLessons,
    progressPercentage,
  };
}
