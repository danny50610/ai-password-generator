import { findMaxPasswordLength, findRequirementCharSet, generateRandomPassword, checkPasswordValid } from './pipeline-block.js';

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

export default generatePipeLine;
