module.exports = {
  parserOptions: {
    ecmaVersion: 9,
    sourceType: 'module'
  },
  env: {
    node: true,
    es6: true
  },
  extends: ['@hellomouse/eslint-config'],
  globals: {
    imports: 'readonly'
  },
  rules: {
    // blame dbus
    'new-cap': 'off'
  }
};
