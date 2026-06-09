import '../config/loadEnv.js';
import { BlobServiceClient } from '@azure/storage-blob';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localUploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(localUploadsDir)) {
  fs.mkdirSync(localUploadsDir, { recursive: true });
}

let blobServiceClient = null;
let containerClient = null;

const storageProvider = (process.env.STORAGE_PROVIDER || '').trim().toLowerCase();
const azureConnectionString = (process.env.AZURE_STORAGE_CONNECTION_STRING || '').trim();
const isAzureEnabled = storageProvider === 'azure' && azureConnectionString;

if (isAzureEnabled) {
  try {
    blobServiceClient = BlobServiceClient.fromConnectionString(azureConnectionString);
    const containerName = (process.env.AZURE_STORAGE_CONTAINER_NAME || 'event-media').trim();
    containerClient = blobServiceClient.getContainerClient(containerName);

    try {
      await containerClient.createIfNotExists({ access: 'blob' });
    } catch (createErr) {
      if (createErr.message.includes('Public access is not permitted')) {
        console.warn('Azure Storage Account restricts public access. Creating a private container instead...');
        await containerClient.createIfNotExists();
      } else {
        throw createErr;
      }
    }
    
    console.log(`Azure Blob Storage initialized. Container: ${containerName}`);
  } catch (err) {
    console.error('Failed to initialize Azure Blob Storage Client:', err.message);
  }
} else {
  console.log(`Local Storage Provider initialized. STORAGE_PROVIDER is '${storageProvider}'. (Fallback: files will be stored in backend/uploads)`);
}

export const uploadFile = async (fileBuffer, originalName, mimeType) => {
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension).replace(/[^a-zA-Z0-9]/g, '_');
  const uniqueFilename = `${baseName}_${Date.now()}${extension}`;

  if (isAzureEnabled && containerClient) {
    const blockBlobClient = containerClient.getBlockBlobClient(uniqueFilename);

    await blockBlobClient.uploadData(fileBuffer, {
      blobHTTPHeaders: {
        blobContentType: mimeType
      }
    });

    const url = blockBlobClient.url;
    return { url, filename: uniqueFilename };
  } else {
   
    const filePath = path.join(localUploadsDir, uniqueFilename);
    await fs.promises.writeFile(filePath, fileBuffer);

    const url = `/uploads/${uniqueFilename}`;
    return { url, filename: uniqueFilename };
  }
};

export const deleteFile = async (filename) => {
  if (isAzureEnabled && containerClient) {
    const blockBlobClient = containerClient.getBlockBlobClient(filename);
    await blockBlobClient.deleteIfExists();
  } else {
    const filePath = path.join(localUploadsDir, filename);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }
};

export const getBlobSasUrl = async (filename) => {
  if (isAzureEnabled && containerClient) {
    try {
      const blockBlobClient = containerClient.getBlockBlobClient(filename);
     
      const { BlobSASPermissions } = await import('@azure/storage-blob');
      return await blockBlobClient.generateSasUrl({
        permissions: BlobSASPermissions.parse("r"),
        expiresOn: new Date(new Date().valueOf() + 86400 * 1000)
      });
    } catch (err) {
      console.error('Failed to generate SAS URL:', err.message);
      return '';
    }
  }
  return `/uploads/${filename}`;
};

export const getFileBuffer = async (filename, fileUrl = '') => {
  if ((isAzureEnabled && containerClient) || (fileUrl && fileUrl.startsWith('http'))) {
    try {
     
      if (isAzureEnabled && containerClient && fileUrl && !fileUrl.startsWith('http://localhost') && !fileUrl.startsWith('/uploads')) {
        const blockBlobClient = containerClient.getBlockBlobClient(filename);
        return await blockBlobClient.downloadToBuffer();
      }

      const response = await fetch(fileUrl);
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error(`Azure getFileBuffer error: ${error.message}`);
      throw error;
    }
  } else {
   
    const filePath = path.join(localUploadsDir, filename);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File ${filename} not found locally.`);
    }
    return await fs.promises.readFile(filePath);
  }
};
