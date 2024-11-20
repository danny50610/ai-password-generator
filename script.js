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

    const systemPromptRole = `
Think step by step, and when you finally output the result, put it on a separate line and add: "Output: " at the beginning.
You are an office assistant responsible for helping your supervisor generate passwords that meet company requirements.

    `;

    const findMaxPasswordLength = async (passwordRules) => {
        const session = await self.ai.languageModel.create({
            temperature: 0,
            topK: 3,
            systemPrompt: `
${systemPromptRole}
If the company's password complexity does not have a minimum password length limit, the default is a minimum of 8 characters
If the company's password complexity does not have a maximum password length limit, the default maximum number of characters requires same as the minimum number of characters.

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

    const characterSets = [
        {
            'name': 'Lowercase letters (a-z)',
            'chars': 'abcdefghijklmnopqrstuvwxyz',
        },
        {
            'name': 'Uppercase letters (A-Z)',
            'chars': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        },
        {
            'name': 'Numbers (0-9)',
            'chars': '0123456789',
        },
        {
            'name': 'Special characters (!@#$%^&*_+)',
            'chars': '!@#$%^&*_+',
        }
    ];
    const findRequirementCharSet = async (passwordRules) => {
        const requirementCharSet = [];
        for (const charSet of characterSets) {
            const result = await testRequirementCharSet(passwordRules, charSet.name);
            if (result === 'yes' || result === 'true') {
                requirementCharSet.push(charSet);
            }
        }

        return requirementCharSet;
    };

    const testRequirementCharSet = async (passwordRules, characterSetName) => {
        const session = await self.ai.languageModel.create({
            temperature: 0,
            topK: 3,
            systemPrompt: `
${systemPromptRole}
Available character sets include:
${characterSets.map((charSet) => `- ${charSet.name}`).join("\n")}
            `,
        });

        const result = await session.prompt(`
The following are the company’s password complexity requirements:
\`\`\`
${passwordRules}
\`\`\`

Regarding this requirement, is ${characterSetName} required in the password?
        `);

        session.destroy();

        return parseLLMoutput(result).toLowerCase();
    };

    const generateRandomPassword = (length, requirementCharSet) => {
        const characterSetsString = requirementCharSet.map((charSet) => charSet.chars).join('');
        const characterSetLength = characterSetsString.length;

        const randomIndex = new Uint32Array(length);
        self.crypto.getRandomValues(randomIndex);

        let password = '';
        for (let i = 0; i < length; i++) {
            password += characterSetsString[randomIndex[i] % characterSetLength];
        }

        return password;
    };

    const checkPasswordValid = async (password, passwordRules) => { 
        const session = await self.ai.languageModel.create({
            temperature: 0,
            topK: 3,
            systemPrompt: `
${systemPromptRole}

            `,
        });

        const result = await session.prompt(`
The following are the company’s password complexity requirements:
\`\`\`
${passwordRules}
\`\`\`

The password chosen by the supervisor is:
\`\`\`
12345678
\`\`\`

Is the password valid?
If it does not valid, please output the reason
        `);

        session.destroy();

        return parseLLMoutput(result);
    };

    generateButton.addEventListener("click", async () => {
        const passwordRules = passwordRulesInput.value.trim();

        const maxPasswordLength = await findMaxPasswordLength(passwordRules);
        const requirementCharSet = await findRequirementCharSet(passwordRules);

        console.log(maxPasswordLength);
        console.log(requirementCharSet);

        const password = generateRandomPassword(maxPasswordLength, requirementCharSet);
        console.log(password);

        const passwordValidResult = await checkPasswordValid(password, passwordRules);
        console.log(passwordValidResult);
    });
})();
