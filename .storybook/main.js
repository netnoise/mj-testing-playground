module.exports = {
  stories: ['../src/**/*.stories.@(ts|mdx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-links',
  ],
  framework: '@storybook/angular',
  core: {
    builder: '@storybook/builder-webpack5',
  },
};
