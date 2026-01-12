import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    const event = payload?.event;
    const paymentId = payload?.payment?.id;

    if (!event || !paymentId) {
      return NextResponse.json({ ok: true });
    }

    // Localiza enrollment pendente pelo paymentId (existe no schema Enrollment.paymentId)
    const enrollment = await prisma.enrollment.findFirst({
      where: { paymentId },
    });

    if (!enrollment) {
      return NextResponse.json({ ok: true });
    }

    // O courseId está em enrollment.courseId e userId em enrollment.userId
    const { userId, courseId } = enrollment;

    if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") {
      await prisma.enrollment.update({
        where: {
          userId_courseId: { userId, courseId },
        },
        data: {
          status: "PAID",
        },
      });

      return NextResponse.json({ ok: true });
    }

    if (
      event === "PAYMENT_REFUNDED" ||
      event === "PAYMENT_CHARGEBACK_REQUESTED" ||
      event === "PAYMENT_CHARGEBACK_DISPUTE" ||
      event === "PAYMENT_CHARGEBACK_REVERSED"
    ) {
      // Remove matrícula e progresso do curso em caso de estorno/chargeback
      await prisma.enrollment.delete({
        where: {
          userId_courseId: { userId, courseId },
        },
      });

      await prisma.completedLesson.deleteMany({
        where: {
          userId,
          lesson: {
            courseId,
          },
        },
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[asaas-webhook] error:", err);
    return NextResponse.json({ ok: true });
  }
}
