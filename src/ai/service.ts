import { requestUrl } from 'obsidian';

export interface AiRequestParams {
	baseUrl: string;
	apiKey: string;
	model: string;
	systemPrompt: string;
	userPrompt: string;
}

/**
 * Sends a chat completion request to an OpenAI-compatible endpoint.
 * Uses Obsidian's native requestUrl to bypass CORS issues if calling external APIs,
 * but keeps it entirely local-first if pointing to Ollama/LocalAI.
 */
export async function fetchAiCompletion(params: AiRequestParams): Promise<string> {
	if (!params.baseUrl) {
		throw new Error('AI Provider URL is not configured.');
	}

	// Normalize URL
	const url = params.baseUrl.replace(/\/$/, '') + '/chat/completions';
	
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
	};

	if (params.apiKey) {
		headers['Authorization'] = `Bearer ${params.apiKey}`;
	}

	const body = JSON.stringify({
		model: params.model || 'gpt-3.5-turbo',
		messages: [
			{ role: 'system', content: params.systemPrompt },
			{ role: 'user', content: params.userPrompt },
		],
		temperature: 0.1, // Keep it relatively deterministic
	});

	try {
		const response = await requestUrl({
			url,
			method: 'POST',
			headers,
			body,
		});

		if (response.status >= 400) {
			throw new Error(`API Error: ${response.status} - ${response.text}`);
		}

		const data = response.json as { choices?: Array<{ message?: { content?: string } }> };
		if (data?.choices?.[0]?.message?.content) {
			return data.choices[0].message.content;
		}

		throw new Error('Unexpected API response format.');
	} catch (error) {
		throw new Error(`AI Request failed: ${error instanceof Error ? error.message : String(error)}`);
	}
}
