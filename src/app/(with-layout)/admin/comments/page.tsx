// import { getAdminComments } from "@/actions/course-comments";
// import { AdminCommentItem } from "@/components/pages/admin/admin-comment-item";

// export default async function AdminCommentsPage() {
//   const comments = await getAdminComments();

//   return (
//     <>
//       <h1 className="text-3xl font-bold">Comentários</h1>

//       <div className="w-full flex flex-col gap-3">
//         {comments.map((comment) => (
//           <AdminCommentItem key={comment.id} comment={comment} />
//         ))}
//       </div>
//     </>
//   );
// }

export const dynamic = 'force-dynamic'
export const revalidate = 0

import { prisma } from '@/lib/prisma'

type CommentRow = {
  id: string
  content: string
  createdAt: Date
  userId: string
  lessonId: string
}

export default async function AdminCommentsPage() {
  // 1) Pega comentários sem include (evita erro de relation name)
  const comments = (await prisma.lessonComment.findMany({
    orderBy: { createdAt: 'desc' },
    // Ajuste aqui se seu campo for "text" em vez de "content"
    select: {
      id: true,
      content: true,
      createdAt: true,
      userId: true,
      lessonId: true,
    },
  })) as CommentRow[]

  const userIds = Array.from(new Set(comments.map((c) => c.userId)))
  const lessonIds = Array.from(new Set(comments.map((c) => c.lessonId)))

  // 2) Users
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      imageUrl: true,
    },
  })

  const usersById = new Map(users.map((u) => [u.id, u]))

  // 3) Lessons (sem include para não depender de relation name)
  // Ajuste o model se no seu Prisma for "courseLesson" com outro nome.
  const lessons = await prisma.courseLesson.findMany({
    where: { id: { in: lessonIds } },
    select: {
      id: true,
      title: true,
      moduleId: true,
    },
  })

  const lessonsById = new Map(lessons.map((l) => [l.id, l]))

  // 4) Modules
  const moduleIds = Array.from(new Set(lessons.map((l) => l.moduleId)))
  const modules = await prisma.courseModule.findMany({
    where: { id: { in: moduleIds } },
    select: {
      id: true,
      title: true,
      courseId: true,
    },
  })

  const modulesById = new Map(modules.map((m) => [m.id, m]))

  // 5) Courses
  const courseIds = Array.from(new Set(modules.map((m) => m.courseId)))
  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds } },
    select: {
      id: true,
      title: true,
      slug: true,
    },
  })

  const coursesById = new Map(courses.map((c) => [c.id, c]))

  // Render
  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Comentários</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os comentários das aulas.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border bg-card">
        <div className="border-b px-4 py-3 text-sm font-medium">
          Lista de comentários
        </div>

        {comments.length === 0 ? (
          <div className="px-4 py-8 text-sm text-muted-foreground">
            Nenhum comentário encontrado.
          </div>
        ) : (
          <ul className="divide-y">
            {comments.map((comment) => {
              const user = usersById.get(comment.userId)
              const lesson = lessonsById.get(comment.lessonId)
              const module = lesson ? modulesById.get(lesson.moduleId) : null
              const course = module ? coursesById.get(module.courseId) : null

              const userName =
                [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
                user?.email ||
                'Usuário'

              return (
                <li key={comment.id} className="px-4 py-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-medium">{userName}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {course?.title ? (
                        <>
                          <span className="font-medium text-foreground">
                            {course.title}
                          </span>
                          {module?.title ? (
                            <>
                              <span className="mx-2">•</span>
                              <span>{module.title}</span>
                            </>
                          ) : null}
                          {lesson?.title ? (
                            <>
                              <span className="mx-2">•</span>
                              <span>{lesson.title}</span>
                            </>
                          ) : null}
                        </>
                      ) : (
                        <span>Referência da aula não encontrada.</span>
                      )}
                    </div>

                    <div className="mt-2 whitespace-pre-wrap text-sm">
                      {comment.content}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
