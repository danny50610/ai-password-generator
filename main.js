(async () => {
    const errorMessage = document.getElementById("error-message");
    
    const examplesSelect = document.getElementById("examples-select");
    const passwordRulesInput = document.getElementById("password-rules-input");
    const generateButton = document.getElementById("generate");

    const resultBlock = document.getElementById("result");
    const passwordCode = document.getElementById("password");
    const passwordCopyButton = document.getElementById("copy-password");
    const generateSuccess = document.getElementById("generate-success");
    const generateFailed = document.getElementById("generate-failed");
    const passwordFailedMessage = document.getElementById("password-failed-message");

    if (!self.ai || !self.ai.languageModel) {
        errorMessage.style.display = "block";
        errorMessage.innerHTML = `Your browser doesn't support the Prompt API. If you're on Chrome, join the <a href="https://developer.chrome.com/docs/ai/built-in#get_an_early_preview">Early Preview Program</a> to enable it.`;
        return;
    }

    const capabilities = await ai.languageModel.capabilities();
    console.log(capabilities);

    const examples = [
        'Minimum 8 characters',
        'Minimum 16 characters',
        'At least 8 characters, must include a mix of letters and numbers, and contain a special character',
        'At least 12 characters, must include a mix of letters and numbers, and contain a special character',
        'At least 8 characters, at most 16 characters, must include a mix of letters and numbers',
        'At least 10 characters, must include a mix of letters and numbers, with no more than 4 consecutive numeric characters',
        'At least 8 characters, must include a mix of letters and numbers, and the password cannot be \'12345678\' or \'password\'',
        'At least 8 characters, must include a mix of letters and numbers, and must not contain the date of birth',
        'At least 8 characters, must include a mix of letters and numbers, and must not contain the ID number.',
        'At least 8 characters, must include a mix of letters and numbers, and must not contain common English words.',
        'Must be at least 8 characters, 1 uppercase, 1 lowercase & 1 number',
        'Minimum 16 characters, max 8 characters',
        'Minimum 8 characters, must empty string',
    ];

    examples.forEach((example, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.text = example;
        examplesSelect.appendChild(option);
    });

    examplesSelect.addEventListener("change", function (event) {
        passwordRulesInput.value = examples[event.target.value];
    });

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
If the company's password complexity does not have a minimum password length limit, the default is a minimum of 8 characters.
If the company's password complexity does not have a maximum password length limit, the default maximum number of characters requires same as the minimum number of characters.
If the maximum length limit is less than the minimum length limit, output "-1".

            `,
        });

        const result = await session.prompt(`
The following are the company’s password complexity requirements:
\`\`\`
${passwordRules}
\`\`\`

Regarding this requirement, what is the maximum number of characters in the password?
        `);

        console.debug(result);

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

        console.debug(result);

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
${password}
\`\`\`

Is the password valid?
If it does not valid, please output the reason
        `);
        
        console.debug(result);

        session.destroy();

        return parseLLMoutput(result);
    };

    const clearResult = () => {
        resultBlock.style.display = "none";

        generateSuccess.style.display = "none";
        generateFailed.style.display = "none";
    }

    const showSuccess = (password) => { 
        resultBlock.style.display = "block";

        passwordCode.innerText = password;
        generateSuccess.style.display = "block";
    }

    const showFailed = (message) => {
        resultBlock.style.display = "block";

        passwordFailedMessage.innerText = message;
        generateFailed.style.display = "block";
    }

    const generatePipeLine = [
        async (contexts) => {
            const passwordRules = contexts.passwordRules;
            const maxPasswordLength = await findMaxPasswordLength(passwordRules);

            const isInt= (string) => /^\d+$/.test(string);
            if (!isInt(maxPasswordLength) || parseInt(maxPasswordLength) <= 0) {
                return {
                    contexts: contexts,
                    error: 'Cannot find the maximum password length, please check the password complexity requirements',
                }
            }

            contexts.maxPasswordLength = maxPasswordLength;

            return {
                contexts: contexts,
                error: null,
            }
        },
        async (contexts) => {
            const passwordRules = contexts.passwordRules;
            const requirementCharSet = await findRequirementCharSet(passwordRules);

            if (requirementCharSet.length === 0) {
                return {
                    contexts: contexts,
                    error: 'Cannot find the requirement character set, please check the password complexity requirements',
                };
            }

            contexts.requirementCharSet = requirementCharSet;

            return {
                contexts: contexts,
                error: null,
            }
        },
        async (contexts) => {
            const passwordRules = contexts.passwordRules;
            const maxPasswordLength = contexts.maxPasswordLength;
            const requirementCharSet = contexts.requirementCharSet;

            let error = '';
            for (let i = 0; i < 20; i += 1) {
                const password = generateRandomPassword(maxPasswordLength, requirementCharSet);
                contexts.password = password;

                const passwordValidResult = await checkPasswordValid(password, passwordRules);

                const passwordValidResultoLowerCase = passwordValidResult.toLowerCase();
                if (passwordValidResultoLowerCase === 'yes' || passwordValidResultoLowerCase === 'valid') {
                    contexts.password = password;
                    return {
                        contexts: contexts,
                        error: null,
                    };
                } else {
                    error = 'Generate Password: ' + password + "\n" + passwordValidResult;
                }
            }

            return {
                contexts: contexts,
                error: error,
            };
        },
    ];

    generateButton.addEventListener("click", async () => {
        generateButton.disabled = true;
        generateButton.innerHTML = 'Generating <i class="fa-solid fa-spinner fa-spin-pulse"></i>';

        clearResult();

        try {
            const passwordRules = passwordRulesInput.value.trim();

            let contexts = {
                passwordRules: passwordRules,
            };

            let isError = false;
            for (const pipe of generatePipeLine) {
                const result = await pipe(contexts);
                console.debug(structuredClone(result));
                if (result.error) {
                    isError = true;
                    showFailed(result.error);
                    break;
                }
                contexts = result.contexts;
            }

            if (!isError) {
                showSuccess(contexts.password);
            }
        } finally { 
            generateButton.disabled = false;
            generateButton.innerHTML = 'Generate ✨';
        }
    });

    passwordCopyButton.addEventListener("click", () => {
        navigator.clipboard.writeText(passwordCode.innerText)
            .then(() => {
                alert('Password copied to clipboard');
            })
            .catch((err) => {
                alert(err);
            });
    });
})();
