/**
 * İstemci tarafında Gemini AI analizini getiren servis modülü.
 * Next.js API rotasını (/api/ai) çağırır.
 */
export async function fetchTeamAiAnalysis(
  teamId: string,
  teamName: string,
  probability: number,
  groupLetter: string
): Promise<string> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        teamId,
        teamName,
        probability,
        groupLetter,
      }),
    });

    if (!response.ok) {
      throw new Error(`API Hatası: ${response.statusText}`);
    }

    const data = await response.json();
    return data.analysis || 'Taktiksel analiz verisi alınamadı.';
  } catch (error) {
    console.error("fetchTeamAiAnalysis hatası:", error);
    return 'Analiz servisiyle bağlantı kurulamadı. Lütfen internet bağlantınızı kontrol edin.';
  }
}
