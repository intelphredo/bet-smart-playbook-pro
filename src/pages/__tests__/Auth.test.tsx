import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Auth from '../Auth';

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
  },
}));

// Mock toast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

import { supabase } from '@/integrations/supabase/client';

const renderAuth = () => {
  return render(
    <BrowserRouter>
      <Auth />
    </BrowserRouter>
  );
};

describe('Auth Page Input Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('email input', () => {
    it('renders email input field', () => {
      const { getByPlaceholderText } = renderAuth();
      expect(getByPlaceholderText('Email')).toBeInTheDocument();
    });

    it('accepts valid email format', async () => {
      const user = userEvent.setup();
      const { getByPlaceholderText } = renderAuth();
      const emailInput = getByPlaceholderText('Email');

      await user.type(emailInput, 'test@example.com');
      expect(emailInput).toHaveValue('test@example.com');
    });

    it('updates state on email change', async () => {
      const user = userEvent.setup();
      const { getByPlaceholderText } = renderAuth();
      const emailInput = getByPlaceholderText('Email');

      await user.type(emailInput, 'user@domain.org');
      expect(emailInput).toHaveValue('user@domain.org');
    });

    it('email field has required attribute', () => {
      const { getByPlaceholderText } = renderAuth();
      const emailInput = getByPlaceholderText('Email');
      expect(emailInput).toHaveAttribute('required');
    });

    it('email field has correct type', () => {
      const { getByPlaceholderText } = renderAuth();
      const emailInput = getByPlaceholderText('Email');
      expect(emailInput).toHaveAttribute('type', 'email');
    });
  });

  describe('password input', () => {
    it('renders password input field', () => {
      const { getByPlaceholderText } = renderAuth();
      expect(getByPlaceholderText('Password')).toBeInTheDocument();
    });

    it('password field has type password', () => {
      const { getByPlaceholderText } = renderAuth();
      const passwordInput = getByPlaceholderText('Password');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('accepts password input', async () => {
      const user = userEvent.setup();
      const { getByPlaceholderText } = renderAuth();
      const passwordInput = getByPlaceholderText('Password');

      await user.type(passwordInput, 'securePassword123');
      expect(passwordInput).toHaveValue('securePassword123');
    });

    it('password field has required attribute', () => {
      const { getByPlaceholderText } = renderAuth();
      const passwordInput = getByPlaceholderText('Password');
      expect(passwordInput).toHaveAttribute('required');
    });
  });

  describe('form submission', () => {
    it('calls signInWithPassword on login submit', async () => {
      const user = userEvent.setup();
      (supabase.auth.signInWithPassword as ReturnType<typeof vi.fn>).mockResolvedValue({ error: null });

      const { getByPlaceholderText, getByRole } = renderAuth();

      await user.type(getByPlaceholderText('Email'), 'test@example.com');
      await user.type(getByPlaceholderText('Password'), 'password123');

      const submitButton = getByRole('button', { name: /login/i });
      await user.click(submitButton);

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('shows error toast on auth failure', async () => {
      const user = userEvent.setup();
      (supabase.auth.signInWithPassword as ReturnType<typeof vi.fn>).mockResolvedValue({
        error: { message: 'Invalid credentials' },
      });

      const { getByPlaceholderText, getByRole } = renderAuth();

      await user.type(getByPlaceholderText('Email'), 'test@example.com');
      await user.type(getByPlaceholderText('Password'), 'wrongpassword');

      const submitButton = getByRole('button', { name: /login/i });
      await user.click(submitButton);

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          variant: 'destructive',
        })
      );
    });

    it('disables submit button while loading', async () => {
      const user = userEvent.setup();
      let resolveAuth: () => void;
      const authPromise = new Promise<void>((resolve) => {
        resolveAuth = resolve;
      });

      (supabase.auth.signInWithPassword as ReturnType<typeof vi.fn>).mockReturnValue(authPromise);

      const { getByPlaceholderText, getByRole } = renderAuth();

      await user.type(getByPlaceholderText('Email'), 'test@example.com');
      await user.type(getByPlaceholderText('Password'), 'password123');

      const submitButton = getByRole('button', { name: /login/i });
      await user.click(submitButton);

      // Button should show loading state
      expect(submitButton).toBeDisabled();

      // Resolve the promise
      await act(async () => {
        resolveAuth!();
      });
    });
  });

  describe('toggle between login and signup', () => {
    it('toggles to signup mode', async () => {
      const user = userEvent.setup();
      const { getByText, getByRole } = renderAuth();

      const toggleButton = getByText(/don't have an account/i);
      await user.click(toggleButton);

      expect(getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('toggles back to login mode', async () => {
      const user = userEvent.setup();
      const { getByText, getByRole } = renderAuth();

      // Switch to signup
      await user.click(getByText(/don't have an account/i));
      
      // Switch back to login
      await user.click(getByText(/already have an account/i));

      expect(getByRole('button', { name: /login/i })).toBeInTheDocument();
    });
  });
});
