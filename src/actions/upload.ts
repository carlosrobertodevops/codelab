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

"use server";

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { createId } from "@paralleldrive/cuid2";

type CloudflareEnv = {
  accountId: string;
  accessId: string;
  accessKey: string;
  bucketName: string;
  fileBasePath: string;
};

let cachedS3: S3Client | null = null;
let cachedEnv: CloudflareEnv | null = null;

const getCloudflareEnv = (): CloudflareEnv => {
  if (cachedEnv) return cachedEnv;

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessId = process.env.CLOUDFLARE_ACCESS_ID;
  const accessKey = process.env.CLOUDFLARE_ACCESS_KEY;
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  const fileBasePath = process.env.CLOUDFLARE_FILE_BASE_PATH;

  if (!accountId || !accessId || !accessKey || !bucketName || !fileBasePath) {
    throw new Error("Cloudflare credentials are not set");
  }

  cachedEnv = {
    accountId,
    accessId,
    accessKey,
    bucketName,
    fileBasePath,
  };

  return cachedEnv;
};

const getS3 = (): S3Client => {
  if (cachedS3) return cachedS3;
  const env = getCloudflareEnv();

  cachedS3 = new S3Client({
    region: "auto",
    endpoint: `https://${env.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.accessId,
      secretAccessKey: env.accessKey,
    },
  });

  return cachedS3;
};

type UploadFileParams = {
  file: File;
  path: string;
};

export const uploadFile = async ({ file, path }: UploadFileParams) => {
  const { bucketName, fileBasePath } = getCloudflareEnv();
  const S3 = getS3();

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
    Bucket: bucketName,
    Key: objectKey,
    ContentLength: size,
    ContentType: fileType,
    Body: Buffer.from(await file.arrayBuffer()),
  });

  await S3.send(cmd);

  const fileUrl = `${fileBasePath}/${objectKey}`;

  return {
    url: fileUrl,
  };
};

export const deleteFile = async (url: string) => {
  const { bucketName, fileBasePath } = getCloudflareEnv();
  const S3 = getS3();

  const objectKey = url.split(`${fileBasePath}/`)[1];
  if (!objectKey) {
    throw new Error("Invalid file URL");
  }

  const cmd = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
  });

  await S3.send(cmd);
};
