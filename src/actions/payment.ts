"use server";

import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { AsaasCustomerResponse, AsaasPaymentResponse } from "@/types/asaas";

const ASAAS_API_URL = process.env.ASAAS_API_URL!;
const ASAAS_API_KEY = process.env.ASAAS_API_KEY!;

type CreatePixCheckoutParams = {
  courseId: string;
};

type CreateCreditCardCheckoutParams = {
  courseId: string;
  creditCard: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone: string;
  };
};

async function asaasFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${ASAAS_API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: ASAAS_API_KEY,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(
      typeof json?.errors?.[0]?.description === "string"
        ? json.errors[0].description
        : `Asaas request failed (${res.status})`,
    );
  }

  return json as T;
}

export async function createPixCheckout({ courseId }: CreatePixCheckoutParams) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const userId = user.id;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) throw new Error("Course not found");

  // No schema, a “compra” é representada por Enrollment (chave composta userId+courseId).
  const userHasCourse = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
  });

  if (userHasCourse) throw new Error("User already has this course");

  // Cria/recupera customer no Asaas
  const customer = await asaasFetch<AsaasCustomerResponse>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: user.fullName ?? user.emailAddresses?.[0]?.emailAddress ?? "Cliente",
      email: user.emailAddresses?.[0]?.emailAddress,
      externalReference: userId,
    }),
  });

  // Cria pagamento PIX
  const payment = await asaasFetch<AsaasPaymentResponse>("/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: customer.id,
      billingType: "PIX",
      value: course.price,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
      description: `Compra do curso: ${course.title}`,
      externalReference: courseId,
    }),
  });

  // Cria enrollment pendente associado ao payment
  await prisma.enrollment.create({
    data: {
      userId,
      courseId,
      paymentId: payment.id,
      status: "PENDING",
    },
  });

  return payment;
}

export async function createCreditCardCheckout(
  params: CreateCreditCardCheckoutParams,
) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const userId = user.id;

  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
  });

  if (!course) throw new Error("Course not found");

  const userHasCourse = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId: params.courseId,
      },
    },
  });

  if (userHasCourse) throw new Error("User already has this course");

  const customer = await asaasFetch<AsaasCustomerResponse>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name:
        params.creditCardHolderInfo.name ??
        user.fullName ??
        user.emailAddresses?.[0]?.emailAddress ??
        "Cliente",
      email: params.creditCardHolderInfo.email,
      cpfCnpj: params.creditCardHolderInfo.cpfCnpj,
      postalCode: params.creditCardHolderInfo.postalCode,
      addressNumber: params.creditCardHolderInfo.addressNumber,
      phone: params.creditCardHolderInfo.phone,
      externalReference: userId,
    }),
  });

  const payment = await asaasFetch<AsaasPaymentResponse>("/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: customer.id,
      billingType: "CREDIT_CARD",
      value: course.price,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
      description: `Compra do curso: ${course.title}`,
      externalReference: params.courseId,
      creditCard: params.creditCard,
      creditCardHolderInfo: params.creditCardHolderInfo,
    }),
  });

  await prisma.enrollment.create({
    data: {
      userId,
      courseId: params.courseId,
      paymentId: payment.id,
      status: "PENDING",
    },
  });

  return payment;
}
