import 'server-only';

import path from 'path';
import mammoth from 'mammoth';

export interface UploadedFile {
  name: string;
  content: string;
}

export interface ExtractedFile {
  name: string;
  text: string;
}

const SUPPORTED_EXTENSIONS = new Set(['.txt', '.md', '.docx']);

const normalizeBase64 = (content: string) => {
  const marker = 'base64,';
  return content.includes(marker) ? content.split(marker).pop() ?? '' : content;
};

const ensureUtf8 = (value: string) => value.replace(/\r\n/g, '\n').trim();

export async function extractTextFromFiles(files: UploadedFile[]): Promise<ExtractedFile[]> {
  const results: ExtractedFile[] = [];

  for (const file of files) {
    const extension = path.extname(file.name).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(extension)) {
      continue;
    }

    const base64 = normalizeBase64(file.content);
    const buffer = Buffer.from(base64, 'base64');

    if (extension === '.docx') {
      const extraction = await mammoth.extractRawText({ buffer });
      results.push({ name: file.name, text: ensureUtf8(extraction.value || '') });
      continue;
    }

    results.push({ name: file.name, text: ensureUtf8(buffer.toString('utf-8')) });
  }

  return results;
}

export function formatExtractedFiles(files: ExtractedFile[]): string {
  if (files.length === 0) return '';

  const sections = files
    .map((file) => `## ${file.name}\n${file.text || '[No text extracted]'}`)
    .join('\n\n');

  return ['---', 'Uploaded files:', sections].join('\n\n');
}
