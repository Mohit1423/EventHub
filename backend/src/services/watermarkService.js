import sharp from 'sharp';

export const applyWatermark = async (fileBuffer, { clubName = 'Club', eventName = 'Event', userRole = 'Viewer' } = {}) => {
  try {
    const image = sharp(fileBuffer);
    const metadata = await image.metadata();

    const width = metadata.width || 800;
    const height = metadata.height || 600;

    const text = `${clubName.toUpperCase()} - ${eventName} (${userRole})`;

    const svgOverlay = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .diagonal-text {
            fill: rgba(255, 255, 255, 0.18);
            font-size: ${Math.round(width * 0.045)}px;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-weight: bold;
            text-anchor: middle;
          }
          .bar-bg {
            fill: rgba(0, 0, 0, 0.6);
          }
          .bar-text {
            fill: #ffffff;
            font-size: ${Math.round(width * 0.02)}px;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-weight: 600;
            letter-spacing: 2px;
          }
        </style>
        
        <!-- Center diagonal watermark -->
        <g transform="translate(${width / 2}, ${height / 2}) rotate(-30)">
          <text x="0" y="0" class="diagonal-text">${text}</text>
        </g>
        
        <!-- Bottom branding bar -->
        <rect x="0" y="${height - Math.round(height * 0.06)}" width="${width}" height="${Math.round(height * 0.06)}" class="bar-bg" />
        <text x="${width / 2}" y="${height - Math.round(height * 0.022)}" text-anchor="middle" class="bar-text">
          PROTECTED BY ANTIGRAVITY PLATFORM | ${text}
        </text>
      </svg>
    `;

    const watermarkedBuffer = await image
      .composite([
        {
          input: Buffer.from(svgOverlay),
          top: 0,
          left: 0,
        },
      ])
      .toBuffer();

    return watermarkedBuffer;
  } catch (error) {
    console.error('Failed to apply watermark:', error);
   
    return fileBuffer;
  }
};
