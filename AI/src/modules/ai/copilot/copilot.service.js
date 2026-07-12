const { openai, MODEL } = require('../../../config/openai');
const { toolSchemas, executors } = require('./copilot.tools');

const SYSTEM_PROMPT = `You are the TransitOps Dispatch Copilot.

Your ONLY job: turn a natural-language dispatch request into a proposed trip
by calling the provided tools, then return a final structured proposal.

Hard rules:
1. You must NEVER invent, guess, or reuse vehicle_id / driver_id values from
   your own knowledge or from a previous unrelated conversation. Every ID you
   reference in your final answer MUST have come from a "search_available_vehicles"
   or "search_available_drivers" tool result in THIS conversation.
2. Before your final answer, you MUST call "validate_trip" on the exact
   vehicle_id / driver_id / cargo_weight_kg you intend to propose, and that
   call must return valid: true. If it returns valid: false, pick a different
   candidate (re-search if needed) or, if nothing works, report no match.
3. You never create a trip. You only PROPOSE one. The real trip creation goes
   through the existing rules engine at POST /trips, which will re-validate
   everything independently.
4. If no vehicle or driver satisfies the request (e.g. no vehicle with enough
   capacity, or no valid driver), do NOT fabricate a fallback. Return a final
   answer with "match": false and a short reason.
5. Prefer the smallest vehicle that satisfies the required capacity (most
   efficient match) and the highest safety_score driver among valid options.
6. Keep the "explanation" field short (1-2 sentences), citing the concrete
   numbers you used (e.g. capacity vs cargo weight).

When you are done gathering information, respond with a FINAL message that is
ONLY a JSON object (no prose, no markdown fences) in exactly this shape:

Match found:
{"match": true, "proposed_trip": {"vehicle_id": <int>, "driver_id": <int>, "source": <string|null>, "destination": <string>, "cargo_weight_kg": <number>}, "explanation": <string>}

No match:
{"match": false, "proposed_trip": null, "explanation": <string>}
`;

const MAX_TOOL_ROUNDS = 6;

/**
 * Runs the tool-calling loop for a single dispatch prompt.
 * Handles multiple round trips (model can call tools several times before
 * giving a final answer), malformed tool-call arguments, and no-match cases.
 */
async function runDispatchCopilot(prompt) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    // eslint-disable-next-line no-await-in-loop
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages,
      tools: toolSchemas,
      tool_choice: 'auto',
      temperature: 0,
    });

    const choice = response.choices[0];
    const msg = choice.message;

    // Case A: model wants to call one or more tools.
    if (msg.tool_calls && msg.tool_calls.length > 0) {
      messages.push(msg); // keep the assistant's tool_call message in history

      // eslint-disable-next-line no-await-in-loop
      const toolResults = await Promise.all(
        msg.tool_calls.map(async (call) => {
          const { name } = call.function;
          let args;
          try {
            args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
          } catch (err) {
            // Malformed JSON arguments from the model — feed the error back
            // instead of crashing, so the model can self-correct.
            return {
              tool_call_id: call.id,
              role: 'tool',
              content: JSON.stringify({ error: `Malformed arguments for ${name}: ${err.message}` }),
            };
          }

          const executor = executors[name];
          if (!executor) {
            return {
              tool_call_id: call.id,
              role: 'tool',
              content: JSON.stringify({ error: `Unknown tool: ${name}` }),
            };
          }

          try {
            const result = await executor(args);
            return {
              tool_call_id: call.id,
              role: 'tool',
              content: JSON.stringify(result),
            };
          } catch (err) {
            return {
              tool_call_id: call.id,
              role: 'tool',
              content: JSON.stringify({ error: `Tool ${name} failed: ${err.message}` }),
            };
          }
        })
      );

      messages.push(...toolResults);
      // continue loop for the next round trip
      // eslint-disable-next-line no-continue
      continue;
    }

    // Case B: model returned a final text answer — parse the JSON contract.
    const text = (msg.content || '').trim();
    const parsed = safeParseFinalAnswer(text);

    if (!parsed) {
      // Model didn't follow the JSON contract. Give it one corrective nudge
      // rather than failing outright.
      messages.push(msg);
      messages.push({
        role: 'user',
        content:
          'Your last response was not valid JSON matching the required schema. Reply again with ONLY the JSON object, no other text.',
      });
      // eslint-disable-next-line no-continue
      continue;
    }

    return normalizeFinalAnswer(parsed);
  }

  // Exhausted rounds without a clean final answer.
  return {
    match: false,
    proposed_trip: null,
    explanation: 'Copilot could not resolve a valid trip proposal within the allotted reasoning steps.',
  };
}

function safeParseFinalAnswer(text) {
  const cleaned = text.replace(/^```json\s*|```$/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function normalizeFinalAnswer(parsed) {
  if (!parsed.match) {
    return {
      match: false,
      proposed_trip: null,
      explanation: parsed.explanation || 'No vehicle/driver combination satisfies the request.',
    };
  }

  const t = parsed.proposed_trip || {};
  return {
    match: true,
    proposed_trip: {
      vehicle_id: t.vehicle_id,
      driver_id: t.driver_id,
      source: t.source ?? null,
      destination: t.destination,
      cargo_weight_kg: t.cargo_weight_kg,
    },
    explanation: parsed.explanation || '',
  };
}

module.exports = { runDispatchCopilot };
