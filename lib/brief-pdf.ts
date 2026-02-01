import PDFDocument from 'pdfkit';

export interface BriefPayload {
  name: string;
  objective: string;
  target_audience: string;
  core_message: string;
  key_benefits: string[];
  channels: string[];
}

function section(doc: PDFKit.PDFDocument, title: string, content: string) {
  doc.fontSize(10).fillColor('#6b7280').text(title.toUpperCase());
  doc.moveDown(0.3);
  doc.fontSize(12).fillColor('#111827').text(content || '—');
  doc.moveDown();
}

export async function renderBriefPdf(payload: BriefPayload) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
  });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  doc.fontSize(20).fillColor('#111827').text(payload.name || 'Untitled Brief');
  doc.moveDown(0.5);
  doc.fontSize(11).fillColor('#6b7280').text(`Generated ${new Date().toLocaleString()}`);
  doc.moveDown(1.5);

  section(doc, 'Objective', payload.objective);
  section(doc, 'Target Audience', payload.target_audience);
  section(doc, 'Core Message', payload.core_message);
  section(doc, 'Channels', payload.channels.join(', ') || '—');

  if (payload.key_benefits.length > 0) {
    doc.fontSize(10).fillColor('#6b7280').text('KEY BENEFITS');
    doc.moveDown(0.3);
    doc.fontSize(12).fillColor('#111827');
    payload.key_benefits.forEach((benefit) => {
      doc.text(`• ${benefit}`);
    });
    doc.moveDown();
  }

  doc.end();
  return done;
}
