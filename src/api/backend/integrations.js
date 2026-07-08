// Client-side integrations.
//
// The app only uses Core.UploadFile (to attach a photo to a team member).
// With no server/object storage, we downscale the image in the browser and
// store it as a data URL, which is then persisted like any other field.

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Resize to fit within maxSize (keeps localStorage small — avatars are tiny).
async function downscaleImage(file, maxSize = 256) {
  try {
    const dataUrl = await readAsDataURL(file);
    if (!String(dataUrl).startsWith('data:image/')) return dataUrl;

    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = dataUrl;
    });

    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    if (scale >= 1) return dataUrl;

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    // JPEG keeps the payload small; good enough for avatars.
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch {
    // Fall back to the raw data URL if canvas processing fails.
    return readAsDataURL(file);
  }
}

export const integrations = {
  Core: {
    async UploadFile({ file } = {}) {
      if (!file) return { file_url: '' };
      const file_url = await downscaleImage(file);
      return { file_url };
    },
  },
};
