module.exports = {
  parser: "@typescript-eslint/parser",
  extends: ["plugin:@typescript-eslint/recommended", "plugin:prettier/recommended"],
  plugins: ["@typescript-eslint", "jest"],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module"
  },
  rules: {
    indent: "off",
    "@typescript-eslint/indent": ["error", 2, { SwitchCase: 1 }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-member-accessibility": "off"
  }
};
