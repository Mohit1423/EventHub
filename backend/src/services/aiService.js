import '../config/loadEnv.js';

const visionEndpoint = (process.env.AZURE_VISION_ENDPOINT || '').trim();
const visionKey = (process.env.AZURE_VISION_KEY || '').trim();

const isVisionEnabled = visionEndpoint && visionKey;

if (isVisionEnabled) {
  console.log('Azure Computer Vision API enabled for image tagging.');
} else {
  console.log('Azure Computer Vision API disabled (missing credentials). Image tags will be empty.');
}

export const generateImageTags = async (fileBuffer, originalName = '') => {
  const tags = [];

  const fallbackTags = originalName.toLowerCase()
    .replace(/\.(jpeg|jpg|png|gif|webp)$/, '')
    .split(/[-_]+/)
    .filter(word => word.length > 2);

  fallbackTags.forEach(tag => {
    if (!tags.includes(tag)) tags.push(tag);
  });

  if (isVisionEnabled) {
    try {
      const baseUrl = visionEndpoint.endsWith('/') ? visionEndpoint.slice(0, -1) : visionEndpoint;
      const url = `${baseUrl}/vision/v3.2/analyze?visualFeatures=Tags,Description,Categories`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': visionKey,
          'Content-Type': 'application/octet-stream'
        },
        body: fileBuffer
      });

      if (response.ok) {
        const data = await response.json();

        if (data.description && data.description.tags) {
          data.description.tags.forEach(t => {
            const cleanTag = t.toLowerCase();
            if (!['text', 'screenshot', 'poster', 'indoor', 'outdoor'].includes(cleanTag) && !tags.includes(cleanTag)) {
              tags.push(cleanTag);
            }
          });
        }

        if (data.tags && data.tags.length > 0) {
          data.tags.forEach(t => {
            const cleanTag = t.name.toLowerCase();
            if (!['text', 'screenshot', 'poster'].includes(cleanTag) && !tags.includes(cleanTag)) {
              tags.push(cleanTag);
            }
          });
        }

        if (data.categories && data.categories.length > 0) {
          data.categories.forEach(c => {
            const parts = c.name.split('_').filter(p => p !== 'others');
            parts.forEach(p => {
              const cleanPart = p.toLowerCase();
              if (cleanPart && !tags.includes(cleanPart)) {
                tags.push(cleanPart);
              }
            });
          });
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        console.error(`Azure Computer Vision API error: ${response.status}`, errData);
      }
    } catch (err) {
      console.error(`Azure Computer Vision fetch failed: ${err.message}`);
    }
  }

  while (tags.length < 3) {
    tags.push('event', 'photo', 'memory')[tags.length];
  }
  return tags.slice(0, 12);
};
