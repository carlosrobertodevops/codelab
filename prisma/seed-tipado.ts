/* prisma/seed.ts */
import { PrismaClient, Prisma } from '../src/generated/prisma'
import fs from 'node:fs'
import path from 'node:path'

type SeedLesson = {
  title: string
  description?: string
  videoId?: string
  durationInMs?: number
}

type SeedModule = {
  title: string
  description?: string
  lessons: SeedLesson[]
}

type SeedCourse = {
  title: string
  slug: string
  description?: string
  shortDescription?: string
  thumbnail?: string
  price?: number
  discountPrice?: number | null

  // Mantém como string para não depender de enum no Prisma
  difficulty?: string

  tags?: string[]
  modules: SeedModule[]
}

const prisma = new PrismaClient()

function readJsonFile<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as T
}

function ensureString(value: unknown, fallback: string) {
  const v = typeof value === 'string' ? value.trim() : ''
  return v.length ? v : fallback
}

function ensureNumber(value: unknown, fallback: number) {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : fallback
  return n
}

/**
 * Tenta normalizar difficulty para valores comuns, mas sem depender de enum.
 * Se vier algo diferente, retorna null e não seta o campo.
 */
function normalizeDifficulty(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const v = value.trim().toUpperCase()
  if (v === 'EASY' || v === 'MEDIUM' || v === 'HARD') return v
  return null
}

async function main() {
  console.log('🌱 Iniciando seed de cursos...')

  const jsonPath = path.join(process.cwd(), 'prisma', 'sample-courses.json')
  const courses = readJsonFile<SeedCourse[]>(jsonPath)

  for (const course of courses) {
    const slug = ensureString(course.slug, '').toLowerCase()
    if (!slug) {
      console.warn('⚠️ Curso sem slug. Pulando:', course.title)
      continue
    }

    const courseTitle = ensureString(course.title, slug)
    const courseDescription = ensureString(
      course.description,
      `Descrição do curso ${courseTitle}.`
    )
    const courseShortDescription = ensureString(
      course.shortDescription,
      courseDescription.slice(0, 140)
    )

    const thumbnail = ensureString(course.thumbnail, '/sample-courses/default.png')
    const price = ensureNumber(course.price, 0)
    const discountPrice =
      course.discountPrice === null || course.discountPrice === undefined
        ? null
        : ensureNumber(course.discountPrice, price)

    const difficulty = normalizeDifficulty(course.difficulty)

    // Monta módulos/lessons com campos obrigatórios do seu schema
    const modulesCreate: Prisma.CourseModuleCreateWithoutCourseInput[] =
      (course.modules ?? []).map((m, moduleIndex) => {
        const moduleTitle = ensureString(m.title, `Módulo ${moduleIndex + 1}`)
        const moduleDescription = ensureString(
          m.description,
          `Descrição do módulo ${moduleTitle}.`
        )

        const lessonsCreate: Prisma.CourseLessonCreateWithoutModuleInput[] =
          (m.lessons ?? []).map((l, lessonIndex) => {
            const lessonTitle = ensureString(l.title, `Aula ${lessonIndex + 1}`)
            const lessonDescription = ensureString(
              l.description,
              `Descrição da aula ${lessonTitle}.`
            )

            return {
              title: lessonTitle,
              description: lessonDescription,
              videoId: ensureString(l.videoId, 'VIDEO_ID_PLACEHOLDER'),
              durationInMs: ensureNumber(l.durationInMs, 0),
              order: lessonIndex + 1,
            }
          })

        return {
          title: moduleTitle,
          description: moduleDescription,
          order: moduleIndex + 1,
          lessons: { create: lessonsCreate },
        }
      })

    // Monta create/update sem depender de tipos de enum
    const createData: any = {
      title: courseTitle,
      slug,
      description: courseDescription,
      shortDescription: courseShortDescription,
      thumbnail,
      price,
      discountPrice,
      status: 'PUBLISHED',
      modules: { create: modulesCreate },
    }

    const updateData: any = {
      title: courseTitle,
      description: courseDescription,
      shortDescription: courseShortDescription,
      thumbnail,
      price,
      discountPrice,
      status: 'PUBLISHED',
      modules: {
        deleteMany: {},
        create: modulesCreate,
      },
    }

    // Só seta difficulty se existir e for um valor aceito
    if (difficulty) {
      createData.difficulty = difficulty
      updateData.difficulty = difficulty
    }

    const upserted = await prisma.course.upsert({
      where: { slug },
      create: createData,
      update: updateData,
      select: { id: true, slug: true, title: true },
    })

    // TAGS (seu schema atual impede reutilizar a mesma tag em vários cursos)
    const tagNames = Array.from(
      new Set((course.tags ?? []).map((t) => ensureString(t, '').trim()).filter(Boolean))
    )

    if (tagNames.length) {
      const existingTags = await prisma.courseTag.findMany({
        where: { name: { in: tagNames } },
        select: { id: true, name: true, courseId: true },
      })

      const existingByName = new Map(existingTags.map((t) => [t.name, t]))

      const toCreate: { name: string; courseId: string }[] = []
      const skipped: string[] = []

      for (const name of tagNames) {
        const found = existingByName.get(name)

        if (!found) {
          toCreate.push({ name, courseId: upserted.id })
          continue
        }

        if (found.courseId && found.courseId !== upserted.id) {
          skipped.push(name)
          continue
        }

        if (!found.courseId) {
          await prisma.courseTag.update({
            where: { id: found.id },
            data: { courseId: upserted.id },
          })
        }
      }

      if (toCreate.length) {
        await prisma.courseTag.createMany({
          data: toCreate,
          skipDuplicates: true,
        })
      }

      if (skipped.length) {
        console.warn(
          `⚠️ Tags já existentes ligadas a outro curso (schema atual impede reuso). Curso=${upserted.slug}. Puladas:`,
          skipped.join(', ')
        )
      }
    }

    console.log(`✅ Seed OK: ${upserted.title} (${upserted.slug})`)
  }

  console.log('🌱 Seed finalizado com sucesso.')
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
