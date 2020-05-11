module.exports = {
  root: true,
  plugins: ["node", "prettier"],
  extends: ["eslint:recommended", "plugin:prettier/recommended"],
  parserOptions: {
    ecmaVersion: 2020,
  },
  env: {
    es6: true,
    node: true,
    jest: true,
  },
  rules: {
    "prettier/prettier": "error",
    "no-empty": ["error", { allowEmptyCatch: true }],
  },
};
