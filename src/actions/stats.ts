"use server";

import { prisma } from "@/lib/prisma";

export async function getStats() {
  const totalUsers = await prisma.user.count();
  const totalCourses = await prisma.course.count();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const purchases = await prisma.enrollment.groupBy({
    by: ["enrolledAt"],
    where: {
      enrolledAt: {
        gte: sevenDaysAgo,
      },
    },
    _count: {
      _all: true,
    },
    orderBy: {
      enrolledAt: "asc",
    },
  });

  return {
    totalUsers,
    totalCourses,
    purchases,
  };
}
