const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const Sharp = require('sharp');

const s3Client = new S3Client({ region: process.env.AWS_REGION });

exports.uploadToS3 = async (file, folder) => {
  const fileExtension = file.originalname.split('.').pop().toLowerCase();
  const fileName = `${folder}/${Date.now()}.${fileExtension}`;

  let buffer = file.buffer;

  // Compress images before uploading
  if (['jpg', 'jpeg', 'png'].includes(fileExtension)) {
    buffer = await Sharp(file.buffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
  }

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileName,
    Body: buffer,
    ContentType: file.mimetype,
  });

  await s3Client.send(command);
  return `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
};
