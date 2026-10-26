export const loadImageFile = (file, { signal } = {}) =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Carregamento cancelado.', 'AbortError'));
      return;
    }
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selecione um arquivo de imagem válido.'));
      return;
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    const cleanup = () => {
      image.onload = null;
      image.onerror = null;
      signal?.removeEventListener('abort', abort);
      URL.revokeObjectURL(url);
    };
    const abort = () => {
      cleanup();
      image.src = '';
      reject(new DOMException('Carregamento cancelado.', 'AbortError'));
    };
    image.onload = () => {
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      cleanup();
      if (!width || !height) {
        reject(new Error('A imagem não possui dimensões válidas.'));
        return;
      }
      resolve({
        image,
        data: {
          width,
          height,
          size: file.size,
          name: file.name || 'image-from-url',
          type: file.type,
        },
      });
    };
    image.onerror = () => {
      cleanup();
      reject(
        new Error(
          'Não foi possível abrir a imagem. O arquivo pode estar corrompido ou em um formato incompatível.'
        )
      );
    };
    signal?.addEventListener('abort', abort, { once: true });
    image.src = url;
  });

export const loadImageUrl = async (value, { signal } = {}) => {
  let url;
  try {
    url = new URL(value.trim());
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error();
  } catch {
    throw new Error(
      'Insira uma URL de imagem válida, iniciada por http ou https.'
    );
  }
  let response;
  try {
    response = await fetch(url.href, { signal, credentials: 'omit' });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error(
      'Não foi possível acessar a imagem. Verifique a conexão e se o site permite CORS.'
    );
  }
  if (!response.ok)
    throw new Error(
      `Não foi possível carregar a imagem (HTTP ${response.status}).`
    );
  return loadImageFile(await response.blob(), { signal });
};
