// Path: src/pages/AdminLogin.tsx
// Purpose: Secure login terminal for admin access
// Dependencies: react, react-hook-form, zod, @tanstack/react-query

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import { useAuthStore } from '../store/authStore';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { user, setAuth } = useAuthStore();

  useEffect(() => {
    if (user && user.role === 'admin') {
      navigate('/admin');
    }
  }, [user, navigate]);

  const { register, handleSubmit } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema)
  });

  const mutation = useMutation({
    mutationFn: (data: LoginFormInputs) => api.post('/auth/login', data).then(r => r.data),
    onSuccess: (data) => {
      setAuth(data.data.user, data.data.accessToken);
      navigate('/admin');
    }
  });

  return (
    <div className="min-h-screen bg-bgBase flex items-center justify-center">
      <div className="w-full max-w-[400px] px-[24px]">
        <div className="font-mono text-[12px] text-textMuted mb-[20px]">
          POST /api/v1/auth/login
        </div>
        <h1 className="font-sans text-[22px] font-medium text-textPrimary m-0 mb-[4px]">
          Admin Access
        </h1>
        <div className="font-mono text-[11px] text-textMuted mb-[28px]">
          // credentials required
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="font-mono text-[12px] leading-[2.2]">
          <div className="text-textMuted">{'{'}</div>
          
          <div className="pl-4 flex items-center mb-2">
            <span className="text-blue shrink-0 w-[90px]">"email"</span>
            <span className="text-textMuted shrink-0 mr-2">:</span>
            <input 
              type="email" 
              {...register('email')}
              className="bg-bgRaised border border-border rounded-[4px] text-textPrimary font-mono text-[12px] px-[10px] py-[6px] w-full outline-none focus:border-green"
            />
          </div>
          
          <div className="pl-4 flex items-center mb-2">
            <span className="text-blue shrink-0 w-[90px]">"password"</span>
            <span className="text-textMuted shrink-0 mr-2">:</span>
            <input 
              type="password" 
              {...register('password')}
              className="bg-bgRaised border border-border rounded-[4px] text-textPrimary font-mono text-[12px] px-[10px] py-[6px] w-full outline-none focus:border-green"
            />
          </div>

          <div className="text-textMuted">{'}'}</div>

          <button 
            type="submit" 
            disabled={mutation.isPending}
            className="w-full bg-green text-[#0a0c0b] font-mono text-[12px] px-[10px] py-[10px] rounded-[4px] border-none mt-[16px] disabled:opacity-50 cursor-pointer"
          >
            {mutation.isPending ? 'authenticating...' : 'POST \u2192'}
          </button>
        </form>

        {mutation.isError && (
          <div className="font-mono text-[11px] text-red mt-[12px]">
            {'{'} "error": "Invalid credentials", "status": 401 {'}'}
          </div>
        )}
      </div>
    </div>
  );
};


