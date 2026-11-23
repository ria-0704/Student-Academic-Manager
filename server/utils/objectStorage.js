// Object storage for uploaded study materials.
//
// - If S3_BUCKET is set → files are stored in S3 (locations look like s3://bucket/key).
// - If S3_BUCKET is NOT set → files are stored on local disk under server/uploads
//   (locations look like local://key). Handy for local development.
const fs = require('fs/promises');
const path = require('path');
const {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} = require('@aws-sdk/client-s3');

const LOCAL_ROOT = path.resolve(__dirname, '..', 'uploads');

let s3 = null;
function getS3() {
  if (!s3) {
    const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-southeast-2';
    s3 = new S3Client({ region });
  }
  return s3;
}

function useS3() {
  return Boolean(process.env.S3_BUCKET);
}

function getBucketName() {
  const bucketName = process.env.S3_BUCKET;
  if (!bucketName) {
    throw new Error('S3_BUCKET is not set in environment variables.');
  }
  return bucketName;
}

function localPathFor(key) {
  const full = path.resolve(LOCAL_ROOT, key);
  if (!full.startsWith(LOCAL_ROOT + path.sep)) {
    throw new Error('Invalid storage key.');
  }
  return full;
}

function createObjectLocation(key) {
  return useS3() ? `s3://${getBucketName()}/${key}` : `local://${key}`;
}

function parseLocation(location) {
  if (location.startsWith('local://')) {
    return { kind: 'local', key: decodeURIComponent(location.slice('local://'.length)) };
  }
  if (location.startsWith('s3://')) {
    const url = new URL(location);
    if (url.hostname !== getBucketName()) {
      throw new Error('Stored material does not belong to the configured S3 bucket.');
    }
    return { kind: 's3', key: decodeURIComponent(url.pathname.slice(1)) };
  }
  // Legacy: plain relative/absolute path on disk
  return { kind: 'legacy', key: location };
}

async function putObject(key, body, contentType) {
  if (useS3()) {
    await getS3().send(new PutObjectCommand({
      Bucket: getBucketName(),
      Key: key,
      Body: body,
      ContentType: contentType,
    }));
    return createObjectLocation(key);
  }
  const full = localPathFor(key);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, body);
  return createObjectLocation(key);
}

async function getObject(location) {
  const { kind, key } = parseLocation(location);
  if (kind === 's3') {
    const response = await getS3().send(new GetObjectCommand({ Bucket: getBucketName(), Key: key }));
    if (!response.Body) {
      throw new Error('S3 returned an empty response for the requested material.');
    }
    return Buffer.from(await response.Body.transformToByteArray());
  }
  const full = kind === 'local' ? localPathFor(key) : path.resolve(__dirname, '..', key);
  return fs.readFile(full);
}

async function deleteObject(location) {
  const { kind, key } = parseLocation(location);
  if (kind === 's3') {
    await getS3().send(new DeleteObjectCommand({ Bucket: getBucketName(), Key: key }));
    return;
  }
  const full = kind === 'local' ? localPathFor(key) : path.resolve(__dirname, '..', key);
  await fs.rm(full, { force: true });
}

module.exports = { createObjectLocation, deleteObject, getObject, putObject };
