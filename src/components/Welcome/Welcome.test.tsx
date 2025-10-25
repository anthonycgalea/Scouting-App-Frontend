import { render, screen } from '@test-utils';
import { Welcome } from './Welcome';

describe('Welcome component', () => {
  it('renders CodyStats logo image', () => {
    render(<Welcome />);
    expect(screen.getByAltText('CodyStats logo')).toBeInTheDocument();
  });
});
