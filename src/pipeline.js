import { translateToEnglish, findMaxPasswordLength, findRequirementCharSet, generateRandomPassword, checkPasswordValid } from './llm.js';

const generatePipeLine = [
    async (contexts) => {
        const passwordRules = contexts.passwordRules;

        const result = await translateToEnglish(passwordRules);

        if (result.error) {
            return {
                contexts: contexts,
                error: result.error,
            };
        }

        contexts.passwordRules = result.result;

        return {
            contexts: contexts,
            error: null,
        };
    },
    async (contexts) => {
        const passwordRules = contexts.passwordRules;
        const maxPasswordLength = await findMaxPasswordLength(passwordRules);

        const isInt = (string) => /^\d+$/.test(string);
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
        for (let i = 0; i < 3; i += 1) {
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

async function runPipeline(
    passwordRules,
    updateProgressBarFunc,
    showSuccessFunc,
    showFailedFunc,
) {
    let contexts = {
        passwordRules: passwordRules,
    };

    let isError = false;
    for (const [index, pipe] of generatePipeLine.entries()) {
        const result = await pipe(contexts);
        console.debug(structuredClone(result));
        if (result.error) {
            isError = true;
            showFailedFunc(result.error);
            break;
        }
        contexts = result.contexts;

        updateProgressBarFunc(index, generatePipeLine.length);
    }

    if (!isError) {
        showSuccessFunc(contexts.password);
    }

    return {
        contexts: contexts,
        isError: isError,
    };
}

export default runPipeline;
