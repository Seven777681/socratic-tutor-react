import type { ImportedAssignmentFile, ImportedTaskSourceType } from "@/types/import";

export interface FileTextExtractionResult {
  file: ImportedAssignmentFile;
  extractedText: string;
  warnings: string[];
}

interface OptionalTextExtractor {
  extractRawText?: (options: { buffer: Buffer }) => Promise<{ value: string }>;
}

interface OptionalZipEntry {
  async(format: "string"): Promise<string>;
}

interface OptionalZip {
  files: Record<string, OptionalZipEntry>;
}

interface OptionalJsZipConstructor {
  loadAsync(buffer: Buffer): Promise<OptionalZip>;
}

type OptionalPdfParseFunction = (buffer: Buffer) => Promise<{ text?: string }>;

interface OptionalPdfParseClass {
  new(options: { data: Buffer | Uint8Array }): {
    getText(): Promise<{ text?: string }>;
    destroy?(): Promise<void>;
  };
}

type OptionalPdfParseModule =
  | OptionalPdfParseFunction
  | {
      PDFParse?: OptionalPdfParseClass;
      default?: OptionalPdfParseFunction;
    };

const supportedTypes: Record<string, ImportedTaskSourceType> = {
  ".pdf": "pdf",
  ".docx": "docx",
  ".pptx": "pptx",
  ".txt": "txt",
  ".md": "markdown",
};

const maxTextLength = 60_000;

function requireOptional<T>(packageName: string): T | undefined {
  try {
    const loader = eval("require") as (name: string) => T;
    return loader(packageName);
  } catch {
    return undefined;
  }
}

export function inferImportedFileType(fileName: string): ImportedTaskSourceType | undefined {
  const lowerName = fileName.toLowerCase();
  const extension = Object.keys(supportedTypes).find((candidate) =>
    lowerName.endsWith(candidate),
  );

  return extension ? supportedTypes[extension] : undefined;
}

function normalizeExtractedText(text: string) {
  return text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
    .slice(0, maxTextLength);
}

function stripXml(xml: string) {
  return xml
    .replace(/<a:t[^>]*>/g, " ")
    .replace(/<\/a:t>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

async function extractDocxText(buffer: Buffer) {
  const mammoth = requireOptional<OptionalTextExtractor>("mammoth");

  if (!mammoth?.extractRawText) {
    return {
      text: "",
      warning:
        "DOCX extraction requires the server-side mammoth package. Try uploading a TXT or Markdown version.",
    };
  }

  try {
    const result = await mammoth.extractRawText({ buffer });
    return { text: result.value, warning: undefined };
  } catch {
    return {
      text: "",
      warning: "DOCX text extraction failed. Try uploading a TXT or text-based PDF version.",
    };
  }
}

async function extractPdfText(buffer: Buffer) {
  const pdfParse = requireOptional<OptionalPdfParseModule>("pdf-parse");

  if (!pdfParse) {
    return {
      text: "",
      warning:
        "PDF extraction requires the server-side pdf-parse package. Try uploading a TXT or DOCX version.",
    };
  }

  try {
    if (typeof pdfParse === "function") {
      const result = await pdfParse(buffer);
      return { text: result.text ?? "", warning: undefined };
    }

    if (typeof pdfParse.default === "function") {
      const result = await pdfParse.default(buffer);
      return { text: result.text ?? "", warning: undefined };
    }

    if (pdfParse.PDFParse) {
      const parser = new pdfParse.PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        return { text: result.text ?? "", warning: undefined };
      } finally {
        await parser.destroy?.();
      }
    }

    return {
      text: "",
      warning:
        "PDF extraction is not compatible with the installed parser version. Try uploading a TXT or DOCX version.",
    };
  } catch {
    return {
      text: "",
      warning:
        "Unable to extract reliable text from this PDF. Try uploading a TXT or DOCX version.",
    };
  }
}

async function extractPptxText(buffer: Buffer) {
  const JSZip = requireOptional<OptionalJsZipConstructor>("jszip");

  if (!JSZip) {
    return {
      text: "",
      warning:
        "PPTX extraction requires the server-side jszip package. Try uploading a TXT or Markdown version.",
    };
  }

  try {
    const zip = await JSZip.loadAsync(buffer);
    const slideNames = Object.keys(zip.files)
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const slides = await Promise.all(
      slideNames.map(async (name, index) => {
        const xml = await zip.files[name].async("string");
        return `Slide ${index + 1}: ${stripXml(xml)}`;
      }),
    );

    return { text: slides.join("\n\n"), warning: undefined };
  } catch {
    return {
      text: "",
      warning: "PPTX text extraction failed. Try uploading a TXT or DOCX version.",
    };
  }
}

export async function extractTextFromAssignmentFile(file: File): Promise<FileTextExtractionResult> {
  const type = inferImportedFileType(file.name);

  if (!type) {
    throw new Error("This file type is not supported. Use PDF, DOCX, PPTX, TXT, or Markdown.");
  }

  const uploadedAt = new Date().toISOString();
  const assignmentFile: ImportedAssignmentFile = {
    id: `upload-${Date.now()}`,
    name: file.name,
    type,
    size: file.size,
    uploadedAt,
  };
  const buffer = Buffer.from(await file.arrayBuffer());
  const warnings: string[] = [];
  let rawText = "";

  if (type === "txt" || type === "markdown") {
    rawText = buffer.toString("utf8");
  } else if (type === "docx") {
    const result = await extractDocxText(buffer);
    rawText = result.text;
    if (result.warning) warnings.push(result.warning);
  } else if (type === "pdf") {
    const result = await extractPdfText(buffer);
    rawText = result.text;
    if (result.warning) warnings.push(result.warning);
  } else if (type === "pptx") {
    const result = await extractPptxText(buffer);
    rawText = result.text;
    if (result.warning) warnings.push(result.warning);
  }

  const extractedText = normalizeExtractedText(rawText);

  if (extractedText.length > 0 && extractedText.length < 120) {
    warnings.push("We could not extract enough readable text from this file.");
  }

  return { file: assignmentFile, extractedText, warnings };
}
