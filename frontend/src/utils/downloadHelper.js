import JSZip from 'jszip';

export const downloadFile = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadAllAsZip = async (parts, format) => {
  const zip = new JSZip();
  
  parts.forEach((part, index) => {
    const filename = `splitcraft-part-${String(index + 1).padStart(3, '0')}.${format}`;
    zip.file(filename, part.blob);
  });

  const content = await zip.generateAsync({ type: 'blob' });
  downloadFile(content, `splitcraft-${Date.now()}.zip`);
};
