import { Meta, Story } from '@storybook/angular';
import { ModelListComponent } from './model-list.component';

export default {
  title: 'Vehicle/ModelListComponent',
  component: ModelListComponent,
} as Meta<ModelListComponent>;

const Template: Story<ModelListComponent> = (args) => ({
  props: args,
});

export const Empty = Template.bind({});
