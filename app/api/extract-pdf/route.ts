import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let parser: any = null;

  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const { PDFParse } = await import('pdf-parse');

    parser = new PDFParse({ data: buffer });
    const result = await parser.getText();

    let text = result.text || '';
    text = text.replace(/\s+/g, ' ').trim();

    if (text.length > 15000) {
      text = text.substring(0, 15000) + '... [truncated]';
    }

    return NextResponse.json({
      success: true,
      text,
      pageCount: result.total ?? 1,
    });

  } catch (error: any) {
    console.error("PDF Parse Error:", error);
    return NextResponse.json({
      error: "Failed to extract text from PDF",
      details: error.message,
    }, { status: 500 });
  } finally {
    if (parser) {
      await parser.destroy();
    }
  }
}