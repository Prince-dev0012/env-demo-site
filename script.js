document.addEventListener('DOMContentLoaded', () => {
    const apiUrlInput = document.getElementById('api-url');
    const projectKeyInput = document.getElementById('project-key');
    const apiNameInput = document.getElementById('api-name');
    const promptInput = document.getElementById('prompt-input');
    const generateBtn = document.getElementById('generate-btn');
    const loadingDiv = document.getElementById('loading');
    const errorBox = document.getElementById('error-box');
    const resultBox = document.getElementById('result-box');
    const resultContent = document.getElementById('result-content');

    // Load saved config
    // Default to the new Cloudflare Worker URL
    const DEFAULT_URL = "https://envapi-worker.free12345543210987.workers.dev/proxy";
    
    const savedUrl = localStorage.getItem('envapi_url') || DEFAULT_URL;
    const savedKey = localStorage.getItem('envapi_key');
    const savedApi = localStorage.getItem('envapi_name');

    apiUrlInput.value = savedUrl; // Always set a valid default
    if (savedKey) projectKeyInput.value = savedKey;
    if (savedApi) apiNameInput.value = savedApi;

    generateBtn.addEventListener('click', async () => {
        const url = apiUrlInput.value.trim();
        const projectKey = projectKeyInput.value.trim();
        const apiName = apiNameInput.value.trim();
        const prompt = promptInput.value.trim();

        if (!url || !projectKey || !apiName || !prompt) {
            showError("Please fill in all configuration fields and the prompt.");
            return;
        }

        // Save config
        localStorage.setItem('envapi_url', url);
        localStorage.setItem('envapi_key', projectKey);
        localStorage.setItem('envapi_name', apiName);

        showLoading(true);
        hideError();
        hideResult();

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // The origin header is automatically set by the browser
                    // but we can pass it manually if needed for server-side testing?
                    // No, browser forbids setting 'Origin' manually.
                },
                body: JSON.stringify({
                    projectKey: projectKey,
                    apiName: apiName,
                    prompt: prompt
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP Error: ${response.status}`);
            }

            const data = await response.json();
            
            // Extract text from Gemini response structure
            // candidates[0].content.parts[0].text
            let text = "No text returned.";
            if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
                text = data.candidates[0].content.parts[0].text;
            } else {
                text = JSON.stringify(data, null, 2); // Fallback to raw JSON
            }

            showResult(text);

        } catch (error) {
            console.error(error);
            showError(error.message);
        } finally {
            showLoading(false);
        }
    });

    function showLoading(isLoading) {
        if (isLoading) {
            loadingDiv.classList.remove('hidden');
            generateBtn.disabled = true;
        } else {
            loadingDiv.classList.add('hidden');
            generateBtn.disabled = false;
        }
    }

    function showError(msg) {
        errorBox.textContent = msg;
        errorBox.classList.remove('hidden');
    }

    function hideError() {
        errorBox.classList.add('hidden');
    }

    function showResult(text) {
        resultContent.textContent = text;
        resultBox.classList.remove('hidden');
    }

    function hideResult() {
        resultBox.classList.add('hidden');
    }
});
