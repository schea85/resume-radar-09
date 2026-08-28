import { unzipSync, strFromU8 } from "fflate";

export class ResumeParseError extends Error {}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function normalize(text: string): string {
  return text
    .replace(/\r/g, "\n")
    .replace(/[ \t\u00a0]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractPdf(bytes: Uint8Array): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return normalize(Array.isArray(text) ? text.join("\n") : text);
}

function extractDocx(bytes: Uint8Array): string {
  const files = unzipSync(bytes);
  const parts = ["word/document.xml", "word/header1.xml", "word/footer1.xml"]
    .filter((name) => files[name])
    .map((name) => strFromU8(files[name]!));

  if (parts.length === 0) {
    throw new ResumeParseError("This DOCX file doesn't contain readable document text.");
  }

  const xml = parts.join("\n");
  const text = xml
    .replace(/<w:tab[^>]*\/>/g, " ")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<w:br[^>]*\/>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

  return normalize(text);
}

/** Extracts plain text from a base64-encoded PDF or DOCX resume. */
export async function extractResumeText(base64: string, filename: string): Promise<string> {
  const bytes = base64ToBytes(base64);
  const lower = filename.toLowerCase();
  const isPdf = lower.endsWith(".pdf") || (bytes[0] === 0x25 && bytes[1] === 0x50);
  const isDocx = lower.endsWith(".docx") || (bytes[0] === 0x50 && bytes[1] === 0x4b);

  let text = "";
  try {
    if (isPdf) {
      text = await extractPdf(bytes);
    } else if (isDocx) {
      text = extractDocx(bytes);
    } else {
      throw new ResumeParseError("Only PDF and DOCX resumes are supported.");
    }
  } catch (error) {
    if (error instanceof ResumeParseError) throw error;
    console.error("resume extraction failed", error);
    throw new ResumeParseError(
      "We couldn't read that file. Try re-exporting it as a text-based PDF or DOCX.",
    );
  }

  if (text.replace(/\s/g, "").length < 120) {
    throw new ResumeParseError(
      "That resume looks empty or image-only. Please upload a text-based PDF or DOCX.",
    );
  }

  return text.slice(0, 24000);
}
