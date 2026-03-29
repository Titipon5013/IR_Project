import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchBar from '../components/SearchBar';
import '@testing-library/jest-dom';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter() {
    return { push: mockPush };
  },
  useSearchParams() {
    return { get: () => null };
  },
  usePathname() {
    return '/';
  }
}));

jest.mock('../lib/api', () => ({
  getSuggestions: jest.fn(() => 
    Promise.resolve({
      suggestions: [
        { Name: 'Chow Mein' }, 
        { Name: 'Chicken Curry' }
      ],
      isTypo: false 
    })
  )
}));

describe('SearchBar Component', () => {
  const mockOnSearch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the search input correctly', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    expect(screen.getByPlaceholderText(/Search for dishes/i)).toBeInTheDocument();
  });

  it('fetches and displays suggestions dropdown when typing', async () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText(/Search for dishes/i);

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Chow' } });

    const suggestion1 = await screen.findByText(/Chow Mein/i);
    const suggestion2 = await screen.findByText(/Chicken Curry/i);

    expect(suggestion1).toBeInTheDocument();
    expect(suggestion2).toBeInTheDocument();
  });

  it('calls onSearch when search button is clicked or Enter is pressed', async () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText(/Search for dishes/i);

    fireEvent.change(input, { target: { value: 'Pad Thai' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    expect(mockOnSearch).toHaveBeenCalledWith('Pad Thai');
  });

});