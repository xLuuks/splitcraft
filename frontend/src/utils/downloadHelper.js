import JSZip from 'jszip';

export const downloadFile = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};

export const createPartsZip = async (parts) => {
  const zip = new JSZip();

  parts.forEach((part, index) => {
    const filename = `splitcraft-part-${String(index + 1).padStart(3, '0')}.${part.extension}`;
    zip.file(filename, part.blob);
  });

  return zip.generateAsync({ type: 'blob' });
};

export const downloadAllAsZip = async (parts) => {
  const content = await createPartsZip(parts);
  downloadFile(content, `splitcraft-${Date.now()}.zip`);
};
