export function parseLLMoutput(llmOutput) {
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

export async function findMaxPasswordLength(passwordRules) {
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

export async function findRequirementCharSet(passwordRules) {
    const requirementCharSet = [];
    for (const charSet of characterSets) {
        const result = await testRequirementCharSet(passwordRules, charSet.name);
        if (result === 'yes' || result === 'true') {
            requirementCharSet.push(charSet);
        }
    }

    if (requirementCharSet.length === 0) {
        const result = await testSuitabilityCharSet(passwordRules, characterSets[0].name);
        if (result === 'yes' || result === 'true') {
            requirementCharSet.push(characterSets[0]);
        }
    }

    return requirementCharSet;
};

async function testRequirementCharSet(passwordRules, characterSetName) {
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

Regarding this requirement, is "${characterSetName}" required in the password ?
        `);

    console.debug(result);

    session.destroy();

    return parseLLMoutput(result).toLowerCase();
};

async function testSuitabilityCharSet(passwordRules, characterSetName) {
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

Should "${characterSetName}" be used in the password for this requirement?
        `);

    console.debug(result);

    session.destroy();

    return parseLLMoutput(result).toLowerCase();
}

export function generateRandomPassword(length, requirementCharSet) {
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

export async function checkPasswordValid (password, passwordRules) {
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
