import { httpClient } from './http-client.js';

export const aiMatchService = {
  async rankCandidates({ vacancyId, candidateIds = [] } = {}) {
    return httpClient('/ai/rank-candidates', {
      method: 'POST',
      body: JSON.stringify({ vacancyId, candidateIds })
    });
  },

  async rankVacancies({ candidateId } = {}) {
    return httpClient('/ai/rank-vacancies', {
      method: 'POST',
      body: JSON.stringify({ candidateId })
    });
  }
};
