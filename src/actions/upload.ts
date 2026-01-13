"use server";

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { createId } from "@paralleldrive/cuid2";

type UploadFileParams = {
  file: File;
  path: string;
};

type CloudflareR2Config = {
  accountId: string;
  accessId: string;
  accessKey: string;
  bucketName: string;
  fileBasePath: string;
};

function getCloudflareR2Config(): CloudflareR2Config {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessId = process.env.CLOUDFLARE_ACCESS_ID;
  const accessKey = process.env.CLOUDFLARE_ACCESS_KEY;
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  const fileBasePath = process.env.CLOUDFLARE_FILE_BASE_PATH;

  if (!accountId || !accessId || !accessKey || !bucketName || !fileBasePath) {
    // Importante: NÃO validar/lançar erro em nível de módulo (isso quebra o build do Next).
    // Valida somente quando a action é chamada.
    throw new Error("Cloudflare credentials are not set");
  }

  return { accountId, accessId, accessKey, bucketName, fileBasePath };
}

let _s3: S3Client | null = null;

function getS3(): { s3: S3Client; cfg: CloudflareR2Config } {
  const cfg = getCloudflareR2Config();

  if (!_s3) {
    _s3 = new S3Client({
      region: "auto",
      endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: cfg.accessId,
        secretAccessKey: cfg.accessKey,
      },
    });
  }

  return { s3: _s3, cfg };
}

export const uploadFile = async ({ file, path }: UploadFileParams) => {
  const { s3, cfg } = getS3();

  const fileName = file.name;
  const fileId = createId();
  const size = file.size;
  const fileType = file.type;

  const fileMaxSize = 1024 * 1024 * 5; // 5MB
  if (size > fileMaxSize) {
    throw new Error("File size is too large");
  }

  const objectKey = `${path}/${fileId}-${fileName}`;

  const cmd = new PutObjectCommand({
    Bucket: cfg.bucketName,
    Key: objectKey,
    ContentLength: size,
    ContentType: fileType,
    Body: Buffer.from(await file.arrayBuffer()),
  });

  await s3.send(cmd);

  const fileUrl = `${cfg.fileBasePath}/${objectKey}`;
  return { url: fileUrl };
};

export const deleteFile = async (url: string) => {
  const { s3, cfg } = getS3();

  const prefix = `${cfg.fileBasePath}/`;
  const objectKey = url.startsWith(prefix) ? url.slice(prefix.length) : url;

  const cmd = new DeleteObjectCommand({
    Bucket: cfg.bucketName,
    Key: objectKey,
  });

  await s3.send(cmd);
};

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
