module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  rules: {
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": ["warn", { allow: ["warn", "error", "info"] }]
  },
  ignorePatterns: ["node_modules/", "dist/", ".next/", "artifacts/", "cache/", "coverage/"],
  overrides: [
    {
      files: ["*.js", "*.cjs"],
      env: { node: true },
      rules: { "@typescript-eslint/no-var-requires": "off" }
    }
  ]
};
