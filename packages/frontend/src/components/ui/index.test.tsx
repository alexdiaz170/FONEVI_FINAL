import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  AnimatedContainer,
  AnimatedFadeIn,
  AnimatedSlideDown,
  AnimatedSlideLeft,
  AnimatedPage,
  AnimatedCard,
  AnimatedButton,
  AnimatedInputWrapper,
  AnimatedStaggerContainer,
  AnimatedStaggerItem,
  GlassCard,
  CardPanel,
} from './index';

function Wrapper({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

describe('AnimatedContainer', () => {
  it('renders children', () => {
    render(
      <AnimatedContainer>
        <p>hello</p>
      </AnimatedContainer>,
    );
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('applies className', () => {
    const { container } = render(<AnimatedContainer className="foo">c</AnimatedContainer>);
    expect(container.querySelector('.foo')).toBeInTheDocument();
  });
});

describe('AnimatedFadeIn', () => {
  it('renders children', () => {
    render(
      <AnimatedFadeIn>
        <span>fade</span>
      </AnimatedFadeIn>,
    );
    expect(screen.getByText('fade')).toBeInTheDocument();
  });

  it('applies className', () => {
    const { container } = render(<AnimatedFadeIn className="bar">c</AnimatedFadeIn>);
    expect(container.querySelector('.bar')).toBeInTheDocument();
  });
});

describe('AnimatedSlideDown', () => {
  it('renders children', () => {
    render(
      <AnimatedSlideDown>
        <span>down</span>
      </AnimatedSlideDown>,
    );
    expect(screen.getByText('down')).toBeInTheDocument();
  });
});

describe('AnimatedSlideLeft', () => {
  it('renders children', () => {
    render(
      <AnimatedSlideLeft>
        <span>left</span>
      </AnimatedSlideLeft>,
    );
    expect(screen.getByText('left')).toBeInTheDocument();
  });
});

describe('AnimatedPage', () => {
  it('renders children', () => {
    render(
      <AnimatedPage>
        <span>page</span>
      </AnimatedPage>,
    );
    expect(screen.getByText('page')).toBeInTheDocument();
  });
});

describe('AnimatedCard', () => {
  it('renders children', () => {
    render(
      <AnimatedCard>
        <span>card</span>
      </AnimatedCard>,
    );
    expect(screen.getByText('card')).toBeInTheDocument();
  });
});

describe('AnimatedButton', () => {
  it('renders children', () => {
    render(<AnimatedButton>click</AnimatedButton>);
    expect(screen.getByText('click')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<AnimatedButton onClick={onClick}>click</AnimatedButton>);
    fireEvent.click(screen.getByText('click'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('respects disabled prop', () => {
    render(<AnimatedButton disabled>disabled</AnimatedButton>);
    expect(screen.getByText('disabled')).toBeDisabled();
  });

  it('sets type attribute', () => {
    render(<AnimatedButton type="submit">submit</AnimatedButton>);
    expect(screen.getByText('submit')).toHaveAttribute('type', 'submit');
  });
});

describe('AnimatedInputWrapper', () => {
  it('renders children', () => {
    render(
      <AnimatedInputWrapper>
        <input />
      </AnimatedInputWrapper>,
    );
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});

describe('AnimatedStaggerContainer', () => {
  it('renders children', () => {
    render(
      <AnimatedStaggerContainer>
        <span>stagger</span>
      </AnimatedStaggerContainer>,
    );
    expect(screen.getByText('stagger')).toBeInTheDocument();
  });
});

describe('AnimatedStaggerItem', () => {
  it('renders children', () => {
    render(
      <AnimatedStaggerItem>
        <span>item</span>
      </AnimatedStaggerItem>,
    );
    expect(screen.getByText('item')).toBeInTheDocument();
  });
});

describe('GlassCard', () => {
  it('renders children', () => {
    render(
      <GlassCard>
        <span>glass</span>
      </GlassCard>,
    );
    expect(screen.getByText('glass')).toBeInTheDocument();
  });

  it('applies padding by default', () => {
    const { container } = render(<GlassCard>glass</GlassCard>);
    expect(container.querySelector('.p-6')).toBeInTheDocument();
  });

  it('removes padding when padding=false', () => {
    const { container } = render(<GlassCard padding={false}>glass</GlassCard>);
    expect(container.querySelector('.p-6')).not.toBeInTheDocument();
  });
});

describe('CardPanel', () => {
  it('renders title and children', () => {
    render(
      <CardPanel title="Panel Title" icon={() => <svg />}>
        content
      </CardPanel>,
    );
    expect(screen.getByText('Panel Title')).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('renders headerRight when provided', () => {
    render(
      <CardPanel title="T" icon={() => <svg />} headerRight={<button>action</button>}>
        c
      </CardPanel>,
    );
    expect(screen.getByText('action')).toBeInTheDocument();
  });
});
