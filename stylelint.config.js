export default {
  extends: ['stylelint-config-standard-scss'],
  rules: {
    'selector-class-pattern': ['\.[a-zA-Z]+(?:-[a-zA-Z]+)*(__[a-zA-Z]+(?:-[a-zA-Z]+)*)*(--[a-zA-Z]+(?:-[a-zA-Z]+)*)?'],
  },
};
