// "use server";

// import { checkRole } from "@/lib/clerk";
// import { prisma } from "@/lib/prisma";
// import {
//   createNotificationSchema,
//   CreateNotificationSchema,
// } from "@/server/schemas/notifications";
// import { getUser } from "./user";

// export const sendNotifications = async (rawData: CreateNotificationSchema) => {
//   const isAdmin = await checkRole("admin");

//   if (!isAdmin) throw new Error("Unauthorized");

//   const data = createNotificationSchema.parse(rawData);

//   const allUserIds = await prisma.user.findMany({
//     select: {
//       id: true,
//     },
//   });

//   await prisma.notification.createMany({
//     data: allUserIds.map((user) => ({
//       userId: user.id,
//       title: data.title,
//       content: data.content,
//       link: data.link,
//     })),
//   });
// };

// export const getNotifications = async () => {
//   const { userId } = await getUser();

//   const notifications = await prisma.notification.findMany({
//     where: { userId },
//     orderBy: { createdAt: "desc" },
//   });

//   return notifications;
// };

// export const readAllNotifications = async () => {
//   const { userId } = await getUser();

//   await prisma.notification.updateMany({
//     where: {
//       userId,
//       readAt: null,
//     },
//     data: {
//       readAt: new Date(),
//     },
//   });
// };

"use server";

import { checkRole } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";
import {
  createNotificationSchema,
  CreateNotificationSchema,
} from "@/server/schemas/notifications";
import { getUser } from "./user";

export const sendNotifications = async (rawData: CreateNotificationSchema) => {
  const isAdmin = await checkRole("admin");

  if (!isAdmin) throw new Error("Unauthorized");

  const data = createNotificationSchema.parse(rawData);

  const allUserIds = await prisma.user.findMany({
    select: {
      id: true,
    },
  });

  await prisma.notification.createMany({
    data: allUserIds.map((user) => ({
      userId: user.id,
      title: data.title,
      content: data.content,
      link: data.link,
    })),
  });
};

export const getNotifications = async () => {
  // Notificações não devem quebrar o app quando o usuário não está autenticado
  // ou ainda não existe no banco.
  const { userId } = await getUser(false);

  if (!userId) return [];

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return notifications;
};

export const readAllNotifications = async () => {
  // Marcar como lidas não deve quebrar quando não existe usuário
  const { userId } = await getUser(false);

  if (!userId) return;

  await prisma.notification.updateMany({
    where: {
      userId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });
};
