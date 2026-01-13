

"use server";

import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

type CreateCommentParams = {
  lessonId: string;
  content: string;
  parentId?: string | null;
};

export async function getLessonComments(lessonId: string) {
  const comments = await prisma.lessonComment.findMany({
    where: { lessonId, parentId: null },
    include: {
      user: true,
      replies: {
        include: {
          user: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return comments;
}

export async function createLessonComment(params: CreateCommentParams) {
  const { lessonId, content, parentId } = params;

  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { course: true },
  });

  if (!lesson) throw new Error("Lesson not found");

  // Garante que o usuário está matriculado no curso da lição
  const userId = user.id;
  const course = lesson.course;

  // No schema, a “compra” é representada por Enrollment (chave composta userId+courseId).
  const userHasCourse = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId: course.id,
      },
    },
  });

  if (!userHasCourse) throw new Error("Forbidden");

  const comment = await prisma.lessonComment.create({
    data: {
      content,
      lessonId,
      userId,
      parentId: parentId ?? null,
    },
  });

  return comment;
}

export async function deleteLessonComment(commentId: string) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const comment = await prisma.lessonComment.findUnique({
    where: { id: commentId },
    include: { lesson: { include: { course: true } } },
  });

  if (!comment) throw new Error("Comment not found");

  const userId = user.id;

  // Garante que o usuário está matriculado no curso da lição
  const userHasCourse = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId: comment.lesson.course.id,
      },
    },
  });

  if (!userHasCourse) throw new Error("Forbidden");

  if (comment.userId !== userId) throw new Error("Forbidden");

  await prisma.lessonComment.delete({ where: { id: commentId } });

  return { ok: true };
}
