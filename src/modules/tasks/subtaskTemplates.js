const { env } = require('../../config/env');

const CHECKPOINTS = [25, 50, 75, 100];

const CATEGORY_TEMPLATES = {
  CLEANING: [
    'Prepare cleaning tools and confirm rooms',
    'Complete deep cleaning of main living areas',
    'Finish kitchen, bathroom, and detail touch-ups',
    'Final walkthrough and requester confirmation',
  ],
  DELIVERY: [
    'Confirm pickup location, item details, and route',
    'Pick up item and start delivery trip',
    'Arrive destination and hand over item safely',
    'Confirm delivery proof with requester',
  ],
  HOME_REPAIR: [
    'Inspect issue and confirm repair scope',
    'Prepare tools and perform core repair',
    'Test repaired area and finalize adjustments',
    'Show result and confirm completion',
  ],
  MOVING: [
    'Prepare packing plan and moving materials',
    'Pack and load items for transport',
    'Transport and unload items at destination',
    'Final arrangement check and handover',
  ],
  TECH_SUPPORT: [
    'Diagnose problem and collect device details',
    'Apply main fix and configuration updates',
    'Test system stability and key functions',
    'Confirm issue resolution with user',
  ],
  IT_SUPPORT: [
    'Diagnose problem and collect device details',
    'Apply main fix and configuration updates',
    'Test system stability and key functions',
    'Confirm issue resolution with user',
  ],
  PERSONAL_ASSISTANT: [
    'Confirm schedule, priorities, and scope',
    'Handle core assistance tasks',
    'Complete remaining errands and follow-ups',
    'Review outcomes and close task',
  ],
  TUTORING: [
    'Assess student needs and learning goals',
    'Deliver main teaching session and exercises',
    'Review practice results and clarify weak areas',
    'Confirm progress and next-study plan',
  ],
  OTHER: [
    'Confirm requirements and expected outcome',
    'Start core execution of requested work',
    'Finish final details and quality checks',
    'Requester review and completion confirmation',
  ],
};

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function compactTitle(value) {
  return String(value || '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 110);
}

function detectKeywordFlags(category, title, description) {
  const text = `${normalizeText(title)} ${normalizeText(description)}`;
  const normalizedCategory = String(category || '').toUpperCase();

  return {
    category: normalizedCategory,
    deepCleaning:
      normalizedCategory === 'CLEANING' &&
      ['deep clean', 'deep cleaning', 'sanit', 'disinfect'].some((keyword) => text.includes(keyword)),
    documentDelivery:
      normalizedCategory === 'DELIVERY' &&
      ['document', 'paperwork', 'contract', 'passport', 'file'].some((keyword) => text.includes(keyword)),
    fragileMoving:
      normalizedCategory === 'MOVING' &&
      ['fragile', 'glass', 'ceramic', 'breakable'].some((keyword) => text.includes(keyword)),
    leakingRepair:
      normalizedCategory === 'HOME_REPAIR' &&
      ['leak', 'sink', 'pipe', 'water'].some((keyword) => text.includes(keyword)),
    installFix:
      ['HOME_REPAIR', 'TECH_SUPPORT', 'IT_SUPPORT'].includes(normalizedCategory) &&
      ['install', 'setup', 'configure'].some((keyword) => text.includes(keyword)),
  };
}

function buildFallbackTitles(category, title, description) {
  const normalizedCategory = String(category || '').toUpperCase();
  const base = [...(CATEGORY_TEMPLATES[normalizedCategory] || CATEGORY_TEMPLATES.OTHER)];
  const flags = detectKeywordFlags(normalizedCategory, title, description);

  if (flags.deepCleaning) {
    base[1] = 'Deep-clean high-touch zones and living areas';
    base[2] = 'Sanitize kitchen, bathroom, and hard-to-reach spots';
  }

  if (flags.documentDelivery) {
    base[1] = 'Pick up documents and verify recipient details';
    base[2] = 'Deliver documents securely with identity check';
  }

  if (flags.fragileMoving) {
    base[1] = 'Pack and label fragile items with extra protection';
    base[2] = 'Transport fragile items carefully and unload safely';
  }

  if (flags.leakingRepair) {
    base[0] = 'Inspect leak source and assess repair method';
    base[1] = 'Repair leaking sink/pipe with required materials';
    base[2] = 'Run water test and tighten all fittings';
  }

  if (flags.installFix) {
    base[1] = 'Install or configure required tools/components';
    base[2] = 'Validate setup and fine-tune key settings';
  }

  if (normalizeText(title).includes('weekly')) {
    base[3] = 'Confirm weekly standard and completion checklist';
  }

  return base.map(compactTitle);
}

function sanitizeAiTitles(candidateTitles, fallbackTitles) {
  if (!Array.isArray(candidateTitles)) return fallbackTitles;
  const cleaned = candidateTitles
    .map((item) => compactTitle(item))
    .filter(Boolean);

  const unique = [];
  for (const title of cleaned) {
    if (!unique.includes(title)) {
      unique.push(title);
    }
    if (unique.length === 4) break;
  }

  while (unique.length < 4) {
    unique.push(fallbackTitles[unique.length]);
  }

  return unique.slice(0, 4);
}

async function requestAiSubtasks(category, title, description) {
  if (!env.GEMINI_API_KEY) return null;

  const prompt = [
    'Generate exactly 4 short task progress checkpoints for a service task marketplace.',
    'Output JSON only as an array of 4 strings. No markdown, no explanation.',
    'Each string should map to 25%, 50%, 75%, and 100% progress respectively.',
    'Keep each checkpoint practical and specific to the task details.',
    '',
    `Category: ${String(category || '').toUpperCase() || 'OTHER'}`,
    `Title: ${String(title || '').trim()}`,
    `Description: ${String(description || '').trim()}`,
  ].join('\n');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.GEMINI_MODEL)}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 220,
        },
      }),
    }
  );

  if (!response.ok) {
    return null;
  }

  const payload = await response.json().catch(() => ({}));
  const textParts = Array.isArray(payload?.candidates?.[0]?.content?.parts)
    ? payload.candidates[0].content.parts.map((item) => String(item?.text || '')).join('\n')
    : '';

  if (!textParts.trim()) return null;

  try {
    const parsed = JSON.parse(textParts);
    return Array.isArray(parsed) ? parsed : null;
  } catch (_error) {
    const jsonMatch = textParts.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return Array.isArray(parsed) ? parsed : null;
    } catch (_nestedError) {
      return null;
    }
  }
}

async function generateSuggestedSubtasks(category, title, description) {
  const fallbackTitles = buildFallbackTitles(category, title, description);
  const aiTitles = await requestAiSubtasks(category, title, description).catch(() => null);
  const titles = sanitizeAiTitles(aiTitles, fallbackTitles);

  return titles.map((item, index) => ({
    title: item,
    order: index + 1,
    progressPercent: CHECKPOINTS[index],
    status: 'PENDING',
  }));
}

module.exports = {
  generateSuggestedSubtasks,
  buildFallbackTitles,
};
