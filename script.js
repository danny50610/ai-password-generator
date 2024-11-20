(async () => {
    const errorMessage = document.getElementById("error-message");
    const passwordRulesInput = document.getElementById("password-rules-input");
    const generateButton = document.getElementById("generate");

    if (!self.ai || !self.ai.languageModel) {
        errorMessage.style.display = "block";
        errorMessage.innerHTML = `Your browser doesn't support the Prompt API. If you're on Chrome, join the <a href="https://developer.chrome.com/docs/ai/built-in#get_an_early_preview">Early Preview Program</a> to enable it.`;
        return;
    }

    const capabilities = await ai.languageModel.capabilities();
    console.log(capabilities);

    // TEST
    passwordRulesInput.value = 'At least 10 characters, must include a mix of letters and numbers, with no more than 4 consecutive numeric characters';

    const parseLLMoutput = (llmOutput) => {
        const outputIndex = llmOutput.lastIndexOf("Output:");
        if (outputIndex !== -1) {
            return llmOutput.substring(outputIndex + 7).trim();
        }
        return null;
    };

    const findMaxPasswordLength = async (passwordRules) => {
        const session = await self.ai.languageModel.create({
            temperature: 0,
            topK: 3,
            systemPrompt: `
Think step by step, and when you finally output the result, put it on a separate line and add: "Output: " at the beginning.
You are an office assistant responsible for helping your supervisor generate passwords that meet company requirements.

If the company's password complexity does not have a minimum password length limit, the default is a minimum of 8 characters
If the company's password complexity does not have a maximum password length limit, the default maximum number of characters requires twice the minimum number of characters.

            `,
        });

        const result = await session.prompt(`
The following are the company’s password complexity requirements:
\`\`\`
${passwordRules}
\`\`\`

Regarding this requirement, what is the maximum number of characters in the password?
        `);

        session.destroy();

        return parseLLMoutput(result);
    };

    generateButton.addEventListener("click", async () => {
        const passwordRules = passwordRulesInput.value.trim();

        const maxPasswordLength = findMaxPasswordLength(passwordRules);
    });
})();
