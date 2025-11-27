import { GoogleGenAI } from "@google/genai";
import { OperationalLog, TaskCompletion, User } from "../types";
import { Language } from "../contexts/LanguageContext";

const getClient = () => {
    const apiKey = process.env.API_KEY || '';
    return new GoogleGenAI({ apiKey });
};

const PROMPT_TEMPLATES: Record<Language, string> = {
    pt: `Atue como um Especialista Sênior em Gestão Industrial e Melhoria Contínua.
        Analise os seguintes dados da fábrica e gere um Plano de Ação conciso e estratégico em formato Markdown.
        Responda em PORTUGUÊS.
        
        Gere:
        1. Análise Breve da Situação (Identifique gargalos ou problemas de disciplina).
        2. 3 Sugestões Práticas para melhoria imediata.
        3. Um Plano de Ação estruturado para a próxima semana.`,
    en: `Act as a Senior Industrial Management and Continuous Improvement Specialist.
        Analyze the following factory data and generate a concise and strategic Action Plan in Markdown format.
        Respond in ENGLISH.
        
        Generate:
        1. Brief Situation Analysis (Identify bottlenecks or discipline issues).
        2. 3 Practical Suggestions for immediate improvement.
        3. A structured Action Plan for the next week.`,
    es: `Actúe como un Especialista Senior en Gestión Industrial y Mejora Continua.
        Analice los siguientes datos de la fábrica y genere un Plan de Acción conciso y estratégico en formato Markdown.
        Responda en ESPAÑOL.
        
        Genere:
        1. Breve Análisis de la Situación (Identifique cuellos de botella o problemas de disciplina).
        2. 3 Sugerencias Prácticas para la mejora inmediata.
        3. Un Plan de Acción estructurado para la próxima semana.`
};

export const generateAIInsights = async (
    logs: OperationalLog[],
    completions: TaskCompletion[],
    users: User[],
    language: Language
): Promise<string> => {
    const ai = getClient();
    
    // Aggregate data for context
    const scrapTotal = logs.filter(l => l.type === 'SCRAP').reduce((acc, curr) => acc + curr.value, 0);
    const downtimeTotal = logs.filter(l => l.type === 'DOWNTIME').reduce((acc, curr) => acc + curr.value, 0);
    const completionRate = completions.filter(c => c.status === 'COMPLETED').length;
    const missedRate = completions.filter(c => c.status === 'MISSED').length;

    const basePrompt = PROMPT_TEMPLATES[language] || PROMPT_TEMPLATES['pt'];

    const prompt = `
        ${basePrompt}
        
        DATA / DADOS / DATOS:
        - Scrap/Refugo: ${scrapTotal}
        - Downtime/Parada: ${downtimeTotal}
        - Tasks Completed/Tarefas Feitas: ${completionRate}
        - Tasks Missed/Tarefas Perdidas: ${missedRate}
        
        RECENT LOGS / OCORRÊNCIAS:
        ${logs.slice(-5).map(l => `- [${l.type}] ${l.description} (Value: ${l.value})`).join('\n')}
        
        Mantenha o tom profissional e direto. / Keep professional tone. / Mantenga el tono profesional.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "No response generated.";
    } catch (error) {
        console.error("Gemini Error:", error);
        return "Error connecting to AI. Please check API Key.";
    }
};
