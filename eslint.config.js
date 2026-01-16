import js from '@eslint/js';
import noSecrets from 'eslint-plugin-no-secrets';
import sonarjs from 'eslint-plugin-sonarjs';
import security from 'eslint-plugin-security';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  // Apply to all JavaScript/TypeScript files
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
    },
  },

  // Recommended ESLint rules
  js.configs.recommended,

  // Security rules
  {
    plugins: {
      security,
      'no-secrets': noSecrets,
    },
    rules: {
      // Prevent secrets in code
      'no-secrets/no-secrets': 'error',

      // Security best practices
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'warn',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-non-literal-require': 'warn',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-pseudoRandomBytes': 'error',
    },
  },

  // Code quality rules (SonarJS)
  {
    plugins: {
      sonarjs,
    },
    rules: {
      // Cognitive complexity
      'sonarjs/cognitive-complexity': ['warn', 15],

      // Duplicate code
      'sonarjs/no-duplicate-string': ['warn', { threshold: 5 }],
      'sonarjs/no-duplicated-branches': 'error',
      'sonarjs/no-identical-functions': 'error',

      // Code smells (only rules available in SonarJS v3.0.5)
      'sonarjs/no-collapsible-if': 'warn',
      'sonarjs/no-identical-conditions': 'error',
      'sonarjs/no-inverted-boolean-check': 'warn',
      'sonarjs/prefer-immediate-return': 'warn',
      'sonarjs/prefer-object-literal': 'warn',
      'sonarjs/prefer-while': 'warn',
    },
  },

  // TypeScript-specific configuration
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: ['**/*.ts'],
  })),

  // TypeScript files - disable some rules
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
      }],
    },
  },

  // Koppen-specific architecture rules
  {
    rules: {
      // Naming conventions (per Architecture doc)
      'camelcase': ['error', {
        properties: 'never',
        ignoreDestructuring: true,
        allow: [
          // Allow snake_case for Köppen classification thresholds
          '^tropical_min$',
          '^arid_threshold$',
          '^cd_boundary$',
          '^hot_summer$',
          '^warm_months$',
          '^dry_month$',
          // Allow snake_case in test files
          '^.*_test$',
          '^.*_spec$',
        ],
      }],

      // Constants should be SCREAMING_SNAKE_CASE
      'no-unused-vars': ['error', {
        varsIgnorePattern: '^[A-Z_]+$',
        argsIgnorePattern: '^_',
      }],

      // Error handling (per Architecture patterns)
      // Use logger.log() from utils/logger.js instead of console.log in production code
      'no-console': ['warn', {
        allow: ['error', 'warn'],
      }],

      // Prevent hard waits in code (tests should use deterministic waits)
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.property.name="waitForTimeout"]',
          message: 'Use waitForResponse() or waitForSelector() instead of waitForTimeout(). Hard waits are non-deterministic.',
        },
        {
          selector: 'CallExpression[callee.property.name="setTimeout"][arguments.length=1]',
          message: 'setTimeout without cleanup can cause memory leaks. Use clearTimeout or consider Vitest fake timers.',
        },
      ],

      // Best practices
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'warn',
      'no-useless-return': 'warn',
      'no-else-return': 'warn',

      // Code style
      'quotes': ['warn', 'single', { avoidEscape: true }],
      'semi': ['warn', 'always'],
      'comma-dangle': ['warn', 'always-multiline'],

      // Prevent common errors
      'no-unreachable': 'error',
      'no-constant-condition': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-empty': ['error', { allowEmptyCatch: false }],
      'no-ex-assign': 'error',
      'no-fallthrough': 'error',
      'no-func-assign': 'error',
      'no-import-assign': 'error',
      'no-irregular-whitespace': 'error',
      'no-loss-of-precision': 'error',
      'no-misleading-character-class': 'error',
      'no-prototype-builtins': 'error',
      'no-regex-spaces': 'error',
      'no-setter-return': 'error',
      'no-sparse-arrays': 'error',
      'no-template-curly-in-string': 'warn',
      'no-unexpected-multiline': 'error',
      'no-unsafe-finally': 'error',
      'no-unsafe-negation': 'error',
      'no-unsafe-optional-chaining': 'error',
      'use-isnan': 'error',
      'valid-typeof': 'error',

      // Accessibility helpers
      'no-alert': 'warn',
      'no-restricted-globals': ['error', 'event', 'fdescribe', 'fit'],
    },
  },

  // Test file specific rules
  {
    files: ['tests/**/*.{test,spec}.{js,ts}', '**/__tests__/**/*.{js,ts}', 'tests/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
        vi: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        test: 'readonly',
      },
    },
    rules: {
      // Relax some rules in test files
      'no-console': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/cognitive-complexity': 'off',
      'no-magic-numbers': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-unused-vars': 'off',
      'security/detect-object-injection': 'off',
    },
  },

  // Ignore patterns
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.vite/**',
      '**/coverage/**',
      '**/.lighthouseci/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '*.min.js',
      'public/data/**', // Ignore generated TopoJSON data
    ],
  },
];
