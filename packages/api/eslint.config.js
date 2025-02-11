const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
	js.configs.recommended,
    {
        languageOptions: {
			sourceType: 'script', // for commonJS
			ecmaVersion: 2022,
            globals: {
               ...globals.node,
            },
        },
        rules: {
            'no-console': 'warn',
            'quotes': ['error', 'single'],
            'semi': ['error', 'always'],
        },
    },
    {
        rules: {
            // Include rules from eslint:recommended
        }
    }
];
