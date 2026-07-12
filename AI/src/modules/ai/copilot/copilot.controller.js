const { z } = require('zod');
const { runDispatchCopilot } = require('./copilot.service');

const bodySchema = z.object({
  prompt: z.string().min(3, 'prompt is required').max(500),
});

async function dispatchCopilot(req, res) {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  try {
    const result = await runDispatchCopilot(parsed.data.prompt);

    if (!result.match) {
      return res.status(200).json({
        proposed_trip: null,
        explanation: result.explanation,
        match: false,
      });
    }

    return res.status(200).json({
      proposed_trip: result.proposed_trip,
      explanation: result.explanation,
      match: true,
      note: 'This is a human-reviewable suggestion only. POST /trips still re-validates everything via the rules engine before any trip is created.',
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[copilot] dispatch failed:', err);
    return res.status(502).json({
      error: 'Copilot could not complete the request (LLM or tool-call failure). Please try again or create the trip manually.',
    });
  }
}

module.exports = { dispatchCopilot };
