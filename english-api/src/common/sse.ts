import type { Response } from 'express';

export async function pipeSse(res: Response, events: AsyncIterable<unknown>) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  try {
    for await (const ev of events) res.write(`data: ${JSON.stringify(ev)}\n\n`);
  } catch {
    res.write(`data: ${JSON.stringify({ type: 'error' })}\n\n`);
  } finally {
    res.end();
  }
}
