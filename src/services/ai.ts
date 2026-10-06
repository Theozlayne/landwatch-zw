const PRIMARY_SPACE_URL = 'https://starrlgnd-landwatch-ai.hf.space';
const FALLBACK_SPACE_URL = process.env.EXPO_PUBLIC_AI_FALLBACK_SPACE_URL?.replace(/\/$/, '') || '';

export type AiAdvisory = {
  aiAnalysisStatus: 'completed' | 'unavailable';
  aiSuggestedCategory?: string | null;
  aiConfidence?: number | null;
  aiDuplicateMatch?: string | null;
  aiDuplicateScore?: number | null;
  aiQuality?: 'clear' | 'unclear' | 'unavailable';
};

async function analyseAtSpace(spaceUrl: string, evidenceUrl: string): Promise<AiAdvisory> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const fileName = evidenceUrl.split('?')[0].split('/').pop() || 'evidence.jpg';
    const request = await fetch(`${spaceUrl}/gradio_api/call/analyse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ image: {
        path: evidenceUrl,
        url: evidenceUrl,
        orig_name: fileName,
        mime_type: 'image/jpeg',
        is_stream: false,
        meta: { _type: 'gradio.FileData' },
      } }),
    });
    if (!request.ok) throw new Error(`AI request failed: ${request.status}`);
    const { event_id: eventId } = await request.json() as { event_id?: string };
    if (!eventId) throw new Error('AI request did not return an event id.');

    const resultResponse = await fetch(`${spaceUrl}/gradio_api/call/analyse/${eventId}`, { signal: controller.signal });
    if (!resultResponse.ok) throw new Error(`AI result failed: ${resultResponse.status}`);
    const stream = await resultResponse.text();
    const dataLine = stream.split('\n').filter((line) => line.startsWith('data: ')).pop();
    const result = dataLine ? JSON.parse(dataLine.slice(6)) as unknown[] : [];
    const value = result[0] as Record<string, unknown> | undefined;

    if (!value || value.status !== 'completed') {
      return { aiAnalysisStatus: 'unavailable', aiQuality: 'unavailable' };
    }

    return {
      aiAnalysisStatus: 'completed',
      aiSuggestedCategory: typeof value.suggestedCategory === 'string' ? value.suggestedCategory : null,
      aiConfidence: typeof value.confidence === 'number' ? value.confidence : null,
      aiDuplicateMatch: value.duplicateMatch ? String(value.duplicateMatch) : null,
      aiDuplicateScore: typeof value.duplicateScore === 'number' ? value.duplicateScore : null,
      aiQuality: value.quality === 'clear' || value.quality === 'unclear' ? value.quality : 'unavailable',
    };
  } catch {
    return { aiAnalysisStatus: 'unavailable', aiQuality: 'unavailable' };
  } finally {
    clearTimeout(timeout);
  }
}

export async function analyseEvidence(evidenceUrl: string): Promise<AiAdvisory> {
  const primary = await analyseAtSpace(PRIMARY_SPACE_URL, evidenceUrl);
  if (primary.aiAnalysisStatus === 'completed' || !FALLBACK_SPACE_URL) return primary;
  return analyseAtSpace(FALLBACK_SPACE_URL, evidenceUrl);
}
