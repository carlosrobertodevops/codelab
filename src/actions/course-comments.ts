"use server";

import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { Prisma } from "@/generated/prisma";

type CommentWithRepliesCount = Prisma.LessonCommentGetPayload<{
  include: {
    user: true;
    _count: {
      select: {
        replies: true;
      };
    };
  };
}>;

type CreateCommentParams = {
  lessonId: string;
  content: string;
  parentId?: string | null;
};

export async function getLessonComments(lessonId: string) {
  const comments = await prisma.lessonComment.findMany({
    where: {
      lessonId,
      parentId: null,
    },
    include: {
      user: true,
      replies: {
        include: {
          user: true,
        },
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: {
          replies: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return comments.map((comment: CommentWithRepliesCount) => ({
    ...comment,
    repliesCount: comment._count.replies,
  }));
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

  const userId = user.userId;

  const userHasCourse = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId: lesson.course.id,
      },
    },
  });

  if (!userHasCourse) throw new Error("Forbidden");

  return prisma.lessonComment.create({
    data: {
      content,
      lessonId,
      userId,
      parentId: parentId ?? null,
    },
  });
}

export async function deleteLessonComment(commentId: string) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const comment = await prisma.lessonComment.findUnique({
    where: { id: commentId },
    include: {
      lesson: {
        include: { course: true },
      },
    },
  });

  if (!comment) throw new Error("Comment not found");

  const userId = user.userId;

  const userHasCourse = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId: comment.lesson.course.id,
      },
    },
  });

  if (!userHasCourse || comment.userId !== userId) {
    throw new Error("Forbidden");
  }

  await prisma.lessonComment.delete({
    where: { id: commentId },
  });

  return { ok: true };
}

/**
 * ✅ ALIAS EXIGIDO PELO FRONT
 */
export const deleteComment = deleteLessonComment;

export async function getAdminComments() {
  return prisma.lessonComment.findMany({
    include: {
      user: true,
      lesson: {
        include: {
          course: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
