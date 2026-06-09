import '../config/loadEnv.js';
import { BlobServiceClient } from '@azure/storage-blob';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create local uploads directory if it doesn't exist
const localUploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(localUploadsDir)) {
  fs.mkdirSync(localUploadsDir, { recursive: true });
}

// Initialize Azure Blob Storage Client only if azure provider is specified and connection string exists
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
    
    // Ensure the container exists and allows public read access to blobs
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

/**
 * Uploads a file to the configured storage (Azure or Local)
 * @param {Buffer} fileBuffer 
 * @param {string} originalName 
 * @param {string} mimeType 
 * @returns {Promise<{url: string, filename: string}>}
 */
export const uploadFile = async (fileBuffer, originalName, mimeType) => {
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension).replace(/[^a-zA-Z0-9]/g, '_');
  const uniqueFilename = `${baseName}_${Date.now()}${extension}`;

  if (isAzureEnabled && containerClient) {
    const blockBlobClient = containerClient.getBlockBlobClient(uniqueFilename);
    
    // Upload buffer to Azure Block Blob
    await blockBlobClient.uploadData(fileBuffer, {
      blobHTTPHeaders: {
        blobContentType: mimeType
      }
    });

    const url = blockBlobClient.url;
    return { url, filename: uniqueFilename };
  } else {
    // Save to local disk
    const filePath = path.join(localUploadsDir, uniqueFilename);
    await fs.promises.writeFile(filePath, fileBuffer);
    
    // We return a path relative to server root
    const url = `/uploads/${uniqueFilename}`;
    return { url, filename: uniqueFilename };
  }
};

/**
 * Deletes a file from the configured storage (Azure or Local)
 * @param {string} filename 
 * @returns {Promise<void>}
 */
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

/**
 * Generates a temporary SAS URL for a private blob so the frontend can display it
 * @param {string} filename 
 * @returns {Promise<string>}
 */
export const getBlobSasUrl = async (filename) => {
  if (isAzureEnabled && containerClient) {
    try {
      const blockBlobClient = containerClient.getBlockBlobClient(filename);
      // We import dynamically or rely on the imported BlobSASPermissions
      const { BlobSASPermissions } = await import('@azure/storage-blob');
      return await blockBlobClient.generateSasUrl({
        permissions: BlobSASPermissions.parse("r"),
        expiresOn: new Date(new Date().valueOf() + 86400 * 1000) // 24 hours valid
      });
    } catch (err) {
      console.error('Failed to generate SAS URL:', err.message);
      return '';
    }
  }
  return `/uploads/${filename}`;
};

/**
 * Retrieves file buffer from configured storage (Azure or Local) for watermarking or processing
 * @param {string} filename 
 * @param {string} fileUrl 
 * @returns {Promise<Buffer>}
 */
export const getFileBuffer = async (filename, fileUrl = '') => {
  if ((isAzureEnabled && containerClient) || (fileUrl && fileUrl.startsWith('http'))) {
    try {
      // If we have containerClient and it's our blob
      if (isAzureEnabled && containerClient && fileUrl && !fileUrl.startsWith('http://localhost') && !fileUrl.startsWith('/uploads')) {
        const blockBlobClient = containerClient.getBlockBlobClient(filename);
        return await blockBlobClient.downloadToBuffer();
      }
      
      // Fallback: Fetch via HTTP URL
      const response = await fetch(fileUrl);
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error(`Azure getFileBuffer error: ${error.message}`);
      throw error;
    }
  } else {
    // Read from local disk
    const filePath = path.join(localUploadsDir, filename);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File ${filename} not found locally.`);
    }
    return await fs.promises.readFile(filePath);
  }
};
