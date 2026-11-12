const {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} = require('@aws-sdk/client-s3');

const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-southeast-2';
const s3 = new S3Client({ region });

function getBucketName() {
  const bucketName = process.env.S3_BUCKET;
  if (!bucketName) {
    throw new Error('S3_BUCKET is not set in environment variables.');
  }
  return bucketName;
}

function createObjectLocation(key) {
  return `s3://${getBucketName()}/${key}`;
}

function getObjectKey(location) {
  const url = new URL(location);
  if (url.protocol !== 's3:' || url.hostname !== getBucketName()) {
    throw new Error('Stored material does not belong to the configured S3 bucket.');
  }
  return decodeURIComponent(url.pathname.slice(1));
}

async function putObject(key, body, contentType) {
  const bucket = getBucketName();
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
  return createObjectLocation(key);
}

async function getObject(location) {
  const response = await s3.send(new GetObjectCommand({
    Bucket: getBucketName(),
    Key: getObjectKey(location),
  }));
  if (!response.Body) {
    throw new Error('S3 returned an empty response for the requested material.');
  }
  return Buffer.from(await response.Body.transformToByteArray());
}

async function deleteObject(location) {
  await s3.send(new DeleteObjectCommand({
    Bucket: getBucketName(),
    Key: getObjectKey(location),
  }));
}

module.exports = { createObjectLocation, deleteObject, getObject, putObject };
