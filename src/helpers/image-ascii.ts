import got from 'got';
import imageToAscii from 'image-to-ascii';

export interface ImageAsciiOptions {
  width?: number;
  colored?: boolean;
}

export const convertImageUrlToAscii = async (url: string, { width = 40, colored = false }: ImageAsciiOptions = {}): Promise<string | undefined> => {
  try {
    const response = await got(url, { responseType: 'buffer', timeout: { request: 8000 } });
    const buffer = response.body;

    return await new Promise<string | undefined>((resolve, reject) => {
      imageToAscii(
        buffer,
        {
          size: {
            width
          },
          colored,
          stringify: true
        },
        (error, converted) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(converted?.trim() || undefined);
        }
      );
    });
  } catch (error) {
    if (error instanceof Error) {
      console.warn(`⚠️  No se pudo convertir logo a ASCII (${error.message})`);
    }
    return undefined;
  }
};
