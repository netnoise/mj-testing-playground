import { Meta, Story } from '@storybook/angular';
import { AppComponent } from './app.component';

export default {
  title: 'App/AppComponent',
  component: AppComponent,
} as Meta<AppComponent>;

const Template: Story<AppComponent> = (args) => ({
  props: args,
});

export const Default = Template.bind({});
