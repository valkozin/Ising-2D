import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeSimulationState = async (temperature: number, magnetization: number, energy: number, magneticField: number): Promise<string> => {
  try {
    const prompt = `
      Ты профессор статистической физики. Проанализируй текущее состояние 2D модели Изинга.
      
      Данные симуляции:
      - Температура (T): ${temperature.toFixed(3)} (в единицах J/k_B). Критическая температура T_c ≈ 2.269.
      - Внешнее магнитное поле (H): ${magneticField.toFixed(3)}.
      - Средняя намагниченность (M): ${magnetization.toFixed(3)} (от -1 до 1).
      - Средняя энергия на спин (E): ${energy.toFixed(3)}.

      Объясни, что происходит в системе на физическом уровне.
      1. Если H != 0, объясни как поле нарушает симметрию "вверх/вниз" и заставляет спины выстраиваться.
      2. Сравни влияние температуры (хаос) и поля (порядок).
      3. Если T < T_c и поле меняет знак, упомяни гистерезис или метастабильные состояния.
      
      Ответь кратко, емко, на русском языке (максимум 4 предложения). Используй научный стиль, но понятно.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    return response.text || "Не удалось получить анализ.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Ошибка при обращении к AI. Проверьте API ключ.";
  }
};