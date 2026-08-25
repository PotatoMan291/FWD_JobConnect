function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9+.#]+/)
    .filter(token => token.length > 2);
}

function overlapScore(leftTokens, rightTokens) {
  const right = new Set(rightTokens);
  return leftTokens.reduce((count, token) => count + (right.has(token) ? 1 : 0), 0);
}

function candidateText(candidate) {
  return [
    candidate.role,
    candidate.professionalTitle,
    candidate.about,
    candidate.coverLetter,
    candidate.workMode,
    candidate.location,
    ...(candidate.skills || []),
    ...(candidate.experience || []).map(item => `${item.title || ''} ${item.description || ''}`)
  ].join(' ');
}

function vacancyText(vacancy) {
  return [
    vacancy.title,
    vacancy.category,
    vacancy.description,
    vacancy.shortDescription,
    vacancy.modality,
    vacancy.experienceLevel,
    vacancy.location,
    ...(vacancy.skills || []),
    ...(vacancy.requirements || [])
  ].join(' ');
}

export function heuristicRankCandidates(vacancy, candidates) {
  const jobTokens = tokenize(vacancyText(vacancy));
  return candidates.map(candidate => {
    const hits = overlapScore(tokenize(candidateText(candidate)), jobTokens);
    const modeBonus = candidate.workMode && vacancy.modality && candidate.workMode.toLowerCase().includes(String(vacancy.modality).toLowerCase().slice(0, 5)) ? 2 : 0;
    const score = Math.min(99, 38 + hits * 7 + modeBonus * 4);
    return {
      id: candidate.id,
      score,
      reason: hits > 0
        ? `Perfil alineado con ${vacancy.title}: ${hits} coincidencias de habilidades o experiencia.`
        : `Afinidad limitada con ${vacancy.title}; conviene revisar el perfil a detalle.`
    };
  }).sort((a, b) => b.score - a.score);
}

export function heuristicRankVacancies(candidate, vacancies) {
  const profileTokens = tokenize(candidateText(candidate));
  return vacancies.map(vacancy => {
    const hits = overlapScore(tokenize(vacancyText(vacancy)), profileTokens);
    const modeBonus = candidate.workMode && vacancy.modality && String(vacancy.modality).toLowerCase().includes(String(candidate.workMode).toLowerCase().slice(0, 5)) ? 2 : 0;
    const score = Math.min(99, 36 + hits * 6 + modeBonus * 5);
    return {
      id: vacancy.id,
      score,
      reason: hits > 0
        ? `Buena oportunidad: tu experiencia encaja con ${vacancy.title}.`
        : `Oportunidad menor frente a ${vacancy.title}.`
    };
  }).sort((a, b) => b.score - a.score);
}

function extractJson(text) {
  if (!text) return null;
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const payload = fenced ? fenced[1] : text;
  const start = payload.indexOf('{');
  const end = payload.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(payload.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function callOpenRouter({ system, user }) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:4000',
      'X-Title': 'JobConnect'
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ]
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenRouter ${response.status}: ${detail.slice(0, 280)}`);
  }

  const data = await response.json();
  return extractJson(data?.choices?.[0]?.message?.content || '');
}

function mergeRankings(fallback, aiResult) {
  const rankings = Array.isArray(aiResult?.rankings) ? aiResult.rankings : [];
  const byId = new Map(rankings.map(item => [String(item.id), item]));
  return fallback.map(item => {
    const ai = byId.get(String(item.id));
    if (!ai) return item;
    const score = Number(ai.score);
    return {
      id: item.id,
      score: Number.isFinite(score) ? Math.max(1, Math.min(99, Math.round(score))) : item.score,
      reason: ai.reason || item.reason
    };
  }).sort((a, b) => b.score - a.score);
}

export async function rankCandidatesWithAi(vacancy, candidates) {
  const fallback = heuristicRankCandidates(vacancy, candidates);
  try {
    const aiResult = await callOpenRouter({
      system: 'Eres un reclutador senior. Responde SOLO JSON válido con forma {"rankings":[{"id":number,"score":number,"reason":"string"}]}. score de 1 a 99. reason en español, una frase.',
      user: JSON.stringify({
        vacancy: {
          id: vacancy.id,
          title: vacancy.title,
          category: vacancy.category,
          skills: vacancy.skills,
          requirements: vacancy.requirements,
          modality: vacancy.modality,
          experienceLevel: vacancy.experienceLevel
        },
        candidates: candidates.map(candidate => ({
          id: candidate.id,
          name: `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim(),
          role: candidate.role,
          skills: candidate.skills,
          about: candidate.about,
          workMode: candidate.workMode,
          yearsOfExperience: candidate.yearsOfExperience
        }))
      })
    });
    return { rankings: mergeRankings(fallback, aiResult), source: aiResult ? 'openrouter' : 'heuristic' };
  } catch (error) {
    return { rankings: fallback, source: 'heuristic', warning: error.message };
  }
}

export async function rankVacanciesWithAi(candidate, vacancies) {
  const fallback = heuristicRankVacancies(candidate, vacancies);
  try {
    const aiResult = await callOpenRouter({
      system: 'Eres un coach de carrera. Responde SOLO JSON válido con forma {"rankings":[{"id":number,"score":number,"reason":"string"}]}. score de 1 a 99. reason en español, una frase sobre por qué el candidato tiene oportunidad en esa vacante.',
      user: JSON.stringify({
        candidate: {
          id: candidate.id,
          name: `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim(),
          role: candidate.role,
          skills: candidate.skills,
          about: candidate.about,
          workMode: candidate.workMode,
          yearsOfExperience: candidate.yearsOfExperience
        },
        vacancies: vacancies.map(vacancy => ({
          id: vacancy.id,
          title: vacancy.title,
          category: vacancy.category,
          skills: vacancy.skills,
          requirements: vacancy.requirements,
          modality: vacancy.modality,
          experienceLevel: vacancy.experienceLevel
        }))
      })
    });
    return { rankings: mergeRankings(fallback, aiResult), source: aiResult ? 'openrouter' : 'heuristic' };
  } catch (error) {
    return { rankings: fallback, source: 'heuristic', warning: error.message };
  }
}
