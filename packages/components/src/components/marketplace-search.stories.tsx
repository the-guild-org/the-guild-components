import { Story, Meta } from '@storybook/react/types-6-0';
import { IMarketplaceSearchProps } from '../types/components';
import { dummyMarketplaceSearch } from '../helpers/dummy';
import { MarketplaceSearch } from './marketplace-search';

export default {
  title: 'Components/Marketplace/Search',
  component: MarketplaceSearch,
  argTypes: {
    title: {
      name: 'Title',
    },
    placeholder: {
      name: 'Input Placeholder',
    },
  },
} as Meta;

const Template: Story<IMarketplaceSearchProps> = args => <MarketplaceSearch {...args} />;

export const Default = Template.bind({});
Default.args = dummyMarketplaceSearch;
