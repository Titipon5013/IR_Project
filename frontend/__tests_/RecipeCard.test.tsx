import { render, screen } from '@testing-library/react';
import RecipeCard from '../components/RecipeCard';
import '@testing-library/jest-dom';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, fill, unoptimized, ...props }: any) => {
    return <img src={src} alt={alt} {...props} />;
  },
}));

describe('RecipeCard Component', () => {
  const mockRecipe = {
    id: 1,
    name: 'Spicy Thai Basil Chicken',
    description: 'A classic Thai street food dish.',
    image: 'https://example.com/basil.jpg',
    category: 'Thai',
    ingredients: 'Chicken, Basil, Chili',
    instructions: 'Stir fry everything together.',
  };

  it('renders recipe details correctly', () => {
    render(<RecipeCard recipe={mockRecipe} onClick={jest.fn()} />);

    expect(screen.getByText('Spicy Thai Basil Chicken')).toBeInTheDocument();
    expect(screen.getByText('Thai')).toBeInTheDocument();
    
    expect(screen.getByText('A classic Thai street food dish.')).toBeInTheDocument();
  });
});