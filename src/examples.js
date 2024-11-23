const examples = [
    {
        'value': 'Minimum 8 characters',
        'test': {
            'asserts': [
                (password) => password.length >= 8,
            ],
        }
    },
    {
        'value': 'Minimum 16 characters',
        'test': {
            'asserts': [
                (password) => password.length >= 16,
            ],
        }
    },
    {
        'value': 'At least 12 characters, must include a mix of letters and numbers, and contain a special character',
        'test': {
            'asserts': [
                (password) => password.length >= 12,
                (password) => /[a-zA-Z]/.test(password),
                (password) => /[0-9]/.test(password),
                (password) => /[!@#\$%\^&\*_\+]/.test(password),
            ],
        }
    },
    {
        'value': 'At least 8 characters, at most 16 characters, must include a mix of letters and numbers',
        'test': {
            'asserts': [
                (password) => password.length >= 8 && password.length <= 16,
                (password) => /[a-zA-Z]/.test(password),
                (password) => /[0-9]/.test(password),
            ],
        }
    },
    {
        'value': 'At least 10 characters, must include a mix of letters and numbers, with no more than 4 consecutive numeric characters',
        'test': {
            'asserts': [
                (password) => password.length >= 10,
                (password) => /[a-zA-Z]/.test(password),
                (password) => /[0-9]/.test(password),
                (password) => !/[0-9]{5}/.test(password),
            ],
        }
    },
    // {
    //     'value': 'At least 8 characters, must include a mix of letters and numbers, and must not contain the date of birth',
    // },
    // {
    //     'value': 'Must be at least 8 characters, 1 uppercase, 1 lowercase & 1 number',
    // },
    // {
    //     'value': 'Minimum 16 characters, max 8 characters',
    // },
    // {
    //     'value': 'Minimum 8 characters, must empty string',
    // }
];

export default examples;
