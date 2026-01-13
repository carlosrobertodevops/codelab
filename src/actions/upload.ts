"use server";

import { getUser } from "@/lib/auth";
import { v4 as uuid } from "uuid";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

/**
 * IMPORTANTE
 * - Não valide credenciais no topo do módulo.
 * - O Next executa imports durante o build e pode avaliar server actions
 *   enquanto coleta dados de páginas.
 * - Se você der throw aqui, o build quebra mesmo sem fazer upload.
 *
 * Portanto: validação e criação do client são "lazy" (somente quando a ação é chamada).
 */

function getCloudflareR2Env() {
  const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
  const CLOUDFLARE_ACCESS_KEY = process.env.CLOUDFLARE_ACCESS_KEY;
  const CLOUDFLARE_ACCESS_ID = process.env.CLOUDFLARE_ACCESS_ID;
  const CLOUDFLARE_R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  const CLOUDFLARE_FILE_BASE_PATH = process.env.CLOUDFLARE_FILE_BASE_PATH;

  if (
    !CLOUDFLARE_ACCOUNT_ID ||
    !CLOUDFLARE_ACCESS_KEY ||
    !CLOUDFLARE_ACCESS_ID ||
    !CLOUDFLARE_R2_BUCKET_NAME ||
    !CLOUDFLARE_FILE_BASE_PATH
  ) {
    throw new Error("Cloudflare credentials are not set");
  }

  return {
    CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_ACCESS_KEY,
    CLOUDFLARE_ACCESS_ID,
    CLOUDFLARE_R2_BUCKET_NAME,
    CLOUDFLARE_FILE_BASE_PATH,
  };
}

function getR2Client() {
  const env = getCloudflareR2Env();

  return {
    env,
    s3: new S3Client({
      region: "auto",
      endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.CLOUDFLARE_ACCESS_ID,
        secretAccessKey: env.CLOUDFLARE_ACCESS_KEY,
      },
    }),
  };
}

type CreateSignedUrlParams = {
  fileType: string;
  fileName: string;
  fileSize: number;
  folder?: string;
};

export async function createSignedUploadUrl({
  fileType,
  fileName,
  folder,
}: CreateSignedUrlParams) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const { env, s3 } = getR2Client();

  const key = `${folder ? `${folder}/` : ""}${uuid()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
    Key: key,
    ContentType: fileType,
  });

  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 });

  const publicUrl = `${env.CLOUDFLARE_FILE_BASE_PATH}/${key}`;

  return { signedUrl, key, publicUrl };
}

type DeleteFileParams = {
  key: string;
};

export async function deleteFile({ key }: DeleteFileParams) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const { env, s3 } = getR2Client();

  const command = new DeleteObjectCommand({
    Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
    Key: key,
  });

  await s3.send(command);

  return { ok: true };
}

// "use server";

// import {
//   S3Client,
//   PutObjectCommand,
//   DeleteObjectCommand,
// } from "@aws-sdk/client-s3";
// import { createId } from "@paralleldrive/cuid2";

// const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
// const CLOUDFLARE_ACCESS_ID = process.env.CLOUDFLARE_ACCESS_ID;
// const CLOUDFLARE_ACCESS_KEY = process.env.CLOUDFLARE_ACCESS_KEY;
// const CLOUDFLARE_R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;
// const CLOUDFLARE_FILE_BASE_PATH = process.env.CLOUDFLARE_FILE_BASE_PATH;

// if (
//   !CLOUDFLARE_ACCOUNT_ID ||
//   !CLOUDFLARE_ACCESS_ID ||
//   !CLOUDFLARE_ACCESS_KEY ||
//   !CLOUDFLARE_R2_BUCKET_NAME ||
//   !CLOUDFLARE_FILE_BASE_PATH
// ) {
//   throw new Error("Cloudflare credentials are not set");
// }

// const S3 = new S3Client({
//   region: "auto",
//   endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
//   credentials: {
//     accessKeyId: CLOUDFLARE_ACCESS_ID,
//     secretAccessKey: CLOUDFLARE_ACCESS_KEY,
//   },
// });

// type UploadFileParams = {
//   file: File;
//   path: string;
// };

// export const uploadFile = async ({ file, path }: UploadFileParams) => {
//   const fileName = file.name;
//   const fileId = createId();
//   const size = file.size;
//   const fileType = file.type;

//   const fileMaxSize = 1024 * 1024 * 5; // 5MB

//   if (size > fileMaxSize) {
//     throw new Error("File size is too large");
//   }

//   const objectKey = `${path}/${fileId}-${fileName}`;

//   const cmd = new PutObjectCommand({
//     Bucket: CLOUDFLARE_R2_BUCKET_NAME,
//     Key: objectKey,
//     ContentLength: size,
//     ContentType: fileType,
//     Body: Buffer.from(await file.arrayBuffer()),
//   });

//   await S3.send(cmd);

//   const fileUrl = `${CLOUDFLARE_FILE_BASE_PATH}/${objectKey}`;

//   return {
//     url: fileUrl,
//   };
// };

// export const deleteFile = async (url: string) => {
//   const objectKey = url.split(`${CLOUDFLARE_FILE_BASE_PATH}/`)[1];

//   const cmd = new DeleteObjectCommand({
//     Bucket: CLOUDFLARE_R2_BUCKET_NAME,
//     Key: objectKey,
//   });

//   await S3.send(cmd);
// };
