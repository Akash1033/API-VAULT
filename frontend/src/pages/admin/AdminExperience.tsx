// Path: src/pages/admin/AdminExperience.tsx
// Purpose: CRUD page for Experience
// Dependencies: react, @tanstack/react-query, react-hook-form, zod

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getExperience, createExperience, updateExperience, deleteExperience } from '../../api/admin';
import { AdminTable } from '../../components/admin/AdminTable';
import { AdminModal } from '../../components/admin/AdminModal';
import { ConfirmDelete } from '../../components/admin/ConfirmDelete';
import { ToggleSwitch } from '../../components/admin/ToggleSwitch';
import { SmartTagInput } from '../../components/admin/SmartTagInput';
import { TECH_SUGGESTIONS } from '../../components/admin/tagSuggestions';
import { CollapsibleSection } from '../../components/admin/CollapsibleSection';
import { useToast } from '../../store/uiStore';
import type { ApiError, Experience, CreateExperiencePayload, UpdateExperiencePayload } from '../../types/admin';

const experienceSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  location: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  description: z.string().optional(),
  achievements: z.string().optional(), // textarea, split on submit
  techStack: z.array(z.string()),
  isPublished: z.boolean(),
  displayOrder: z.number().optional()
});

type ExperienceFormInputs = z.infer<typeof experienceSchema>;

export const AdminExperience: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCurrent, setIsCurrent] = useState(false);

  const { data: experienceData, isLoading } = useQuery({
    queryKey: ['experience'],
    queryFn: () => getExperience({ isPublished: 'all' })
  });
  const experience = experienceData?.data || [];

  const { register, handleSubmit, reset, control, setValue, watch, formState: { errors } } = useForm<ExperienceFormInputs>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      techStack: [],
      isPublished: true,
      achievements: '',
      description: '',
      displayOrder: 0
    }
  });

  const startDateVal = watch('startDate');
  const endDateVal = watch('endDate');
  const achievementsVal = watch('achievements') || '';

  const handleError = (error: unknown) => {
    const axiosError = error as { response?: { data?: { errors?: ApiError[]; message?: string; details?: Array<{ message: string }> } } };
    const message = axiosError?.response?.data?.details?.[0]?.message
      ?? axiosError?.response?.data?.errors?.[0]?.message
      ?? axiosError?.response?.data?.message
      ?? 'An error occurred. Please try again.';
    showToast(message, 'error');
    console.error('API Error:', axiosError?.response?.data);
  };

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => createExperience(data as unknown as CreateExperiencePayload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experience'] });
      setIsModalOpen(false);
      showToast('Experience created successfully', 'success');
    },
    onError: handleError
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Record<string, unknown> }) => updateExperience(id, data as unknown as UpdateExperiencePayload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experience'] });
      setIsModalOpen(false);
      showToast('Experience updated successfully', 'success');
    },
    onError: handleError
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExperience(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experience'] });
      setDeleteId(null);
      showToast('Experience deleted', 'success');
    },
    onError: handleError
  });

  const onSubmit = (data: ExperienceFormInputs) => {
    const payload: Record<string, unknown> = {
      company: data.company,
      role: data.role,
      location: data.location || '',
      startDate: new Date(data.startDate).toISOString(),
      endDate: isCurrent ? undefined : (data.endDate ? new Date(data.endDate).toISOString() : undefined),
      description: data.description || '',
      responsibilities: data.achievements
        ? data.achievements.split('\n').map(s => s.trim()).filter(Boolean)
        : [],
      technologies: data.techStack,
      isPublished: data.isPublished,
      displayOrder: data.displayOrder || 0
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const openNew = () => {
    setIsCurrent(false);
    reset({
      company: '', role: '', location: '', startDate: '', endDate: '', description: '', achievements: '', techStack: [], isPublished: true, displayOrder: 0
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEdit = (row: Experience) => {
    const isCur = !row.endDate;
    setIsCurrent(isCur);
    reset({
      company: row.company,
      role: row.role,
      location: row.location || '',
      startDate: row.startDate ? new Date(row.startDate).toISOString().substring(0,7) : '',
      endDate: row.endDate ? new Date(row.endDate).toISOString().substring(0,7) : '',
      description: row.description || '',
      achievements: (row.responsibilities || []).join('\n'),
      techStack: row.technologies || [],
      isPublished: row.isPublished,
      displayOrder: row.displayOrder || 0
    });
    setEditingId(row._id);
    setIsModalOpen(true);
  };

  function formatDuration(start: string, end?: string): string {
    if (!start) return '';
    try {
      const startDate = new Date(start);
      const endDate = end ? new Date(end) : new Date();
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '';
      
      const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
      if (months < 0) return 'Invalid range';
      if (months === 0) return '1 mo';

      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      
      if (years === 0) return `${remainingMonths} mos`;
      if (remainingMonths === 0) return `${years} yr${years > 1 ? 's' : ''}`;
      return `${years} yr${years > 1 ? 's' : ''} ${remainingMonths} mos`;
    } catch {
      return '';
    }
  }

  const formatPeriod = (start: string, end: string | null) => {
    const format = (dateStr: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };
    const s = format(start);
    if (!end) {
      return (
        <span className="font-mono text-[11px] text-textMuted">
          {s} &rarr; <span className="text-green">present</span>
        </span>
      );
    }
    return (
      <span className="font-mono text-[11px] text-textMuted">
        {s} &rarr; {format(end)}
      </span>
    );
  };

  const columns = [
    { key: 'company', label: 'Company' },
    { key: 'role', label: 'Role' },
    { 
      key: 'period', 
      label: 'Period',
      render: (row: Experience) => formatPeriod(row.startDate, row.endDate || null)
    },
    { 
      key: 'current', 
      label: 'Current',
      render: (row: Experience) => !row.endDate ? (
        <span className="font-mono text-[10px] text-green">● yes</span>
      ) : (
        <span className="font-mono text-[11px] text-textMuted">—</span>
      )
    },
    { 
      key: 'isPublished', 
      label: 'Published',
      render: (row: Experience) => row.isPublished ? (
        <span className="text-green font-mono text-[11px]">yes</span>
      ) : (
        <span className="text-textMuted font-mono text-[11px]">no</span>
      )
    }
  ];

  return (
    <>
      <div className="flex justify-between items-center mb-[24px]">
        <div>
          <div className="font-mono text-[12px] text-green mb-[4px]">GET /api/v1/experience &rarr; 200 OK</div>
          <h1 className="font-sans text-[22px] text-textPrimary m-0 font-medium">Experience</h1>
        </div>
        <button 
          onClick={openNew}
          className="border border-green text-green bg-transparent font-mono text-[12px] px-[16px] py-[8px] rounded-[4px] hover:bg-[rgba(74,222,128,0.08)] cursor-pointer transition-colors"
        >
          + New Experience
        </button>
      </div>

      <AdminTable 
        columns={columns}
        data={experience}
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={(row) => setDeleteId(row._id)}
      />

      <AdminModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="experience" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[16px]">
          
          <div className="grid grid-cols-2 gap-[12px]">
            <div className="flex flex-col">
              <label className="font-mono text-[11px] text-textMuted mb-[4px]">company *</label>
              <input {...register('company')} placeholder="e.g. Zerodha" className="bg-bgRaised border border-border rounded-[4px] font-mono text-[12px] text-textPrimary px-[10px] py-[6px] outline-none focus:border-green w-full" />
              {errors.company && <span className="font-mono text-[10px] text-red mt-[3px]">{errors.company.message}</span>}
            </div>
            
            <div className="flex flex-col">
              <label className="font-mono text-[11px] text-textMuted mb-[4px]">role *</label>
              <input {...register('role')} placeholder="e.g. Senior Backend Engineer" className="bg-bgRaised border border-border rounded-[4px] font-mono text-[12px] text-textPrimary px-[10px] py-[6px] outline-none focus:border-green w-full" />
              {errors.role && <span className="font-mono text-[10px] text-red mt-[3px]">{errors.role.message}</span>}
            </div>
          </div>

          <div className="w-full">
            <ToggleSwitch
              label="isCurrent — currently working here"
              value={isCurrent}
              onChange={(val) => {
                setIsCurrent(val);
                if (val) setValue('endDate', '');
              }}
            />
            {isCurrent && (
              <div className="font-mono text-[11px] text-green mt-[6px]">● currently working here</div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="grid grid-cols-2 gap-[12px]">
              <div className="flex flex-col">
                <label className="font-mono text-[11px] text-textMuted mb-[4px]">startDate *</label>
                <input type="month" {...register('startDate')} className="bg-bgRaised border border-border rounded-[4px] font-mono text-[12px] text-textPrimary px-[10px] py-[6px] outline-none focus:border-green w-full" />
                {errors.startDate && <span className="font-mono text-[10px] text-red mt-[3px]">{errors.startDate.message}</span>}
              </div>
              
              <div className="flex flex-col">
                <label className="font-mono text-[11px] text-textMuted mb-[4px]">endDate</label>
                <input 
                  type="month" 
                  {...register('endDate')} 
                  disabled={isCurrent}
                  style={{ opacity: isCurrent ? 0.4 : 1, cursor: isCurrent ? 'not-allowed' : 'auto' }}
                  className="bg-bgRaised border border-border rounded-[4px] font-mono text-[12px] text-textPrimary px-[10px] py-[6px] outline-none focus:border-green w-full" 
                />
              </div>
            </div>
            
            {startDateVal && (
              <div className="font-mono text-[11px] text-textMuted mt-[6px]">
                // {new Date(startDateVal).toLocaleDateString('en-US', {month:'short', year:'numeric'})} &rarr; {isCurrent ? 'present' : (endDateVal ? new Date(endDateVal).toLocaleDateString('en-US', {month:'short', year:'numeric'}) : 'present')} ({formatDuration(startDateVal, isCurrent ? undefined : endDateVal)})
              </div>
            )}
          </div>

          <CollapsibleSection title="Optional Details">
            <div className="flex flex-col gap-[14px]">
              
              <div className="flex flex-col">
                <label className="font-mono text-[11px] text-textMuted mb-[4px]">location</label>
                <input {...register('location')} placeholder="e.g. Bangalore, India / Remote" className="bg-bgRaised border border-border rounded-[4px] font-mono text-[12px] text-textPrimary px-[10px] py-[6px] outline-none focus:border-green w-full" />
              </div>

              <div className="flex flex-col">
                <label className="font-mono text-[11px] text-textMuted mb-[4px]">description</label>
                <textarea {...register('description')} rows={4} placeholder="Brief description of your role and impact..." className="bg-bgRaised border border-border rounded-[4px] font-mono text-[12px] text-textPrimary px-[10px] py-[6px] outline-none focus:border-green resize-none w-full" />
              </div>

              <div className="flex flex-col">
                <label className="font-mono text-[11px] text-textMuted mb-[4px]">achievements</label>
                <textarea {...register('achievements')} rows={5} placeholder="One achievement per line, e.g:&#10;Reduced API latency by 80%&#10;Built system handling 2M orders/day" className="bg-bgRaised border border-border rounded-[4px] font-mono text-[12px] text-textPrimary px-[10px] py-[6px] outline-none focus:border-green resize-none w-full" />
                <div className="font-mono text-[10px] text-textMuted mt-[4px]">// one per line — displayed as bullet points on portfolio</div>
                
                {achievementsVal && (
                  <div className="mt-[8px]">
                    <div className="font-mono text-[10px] text-textMuted mb-[4px]">// preview</div>
                    <div className="flex flex-col gap-[6px]">
                      {achievementsVal.split('\n').filter(Boolean).slice(0, 2).map((a, i) => (
                        <div key={i} className="flex flex-row gap-[8px]">
                          <span className="font-mono text-[10px] text-green">&rarr;</span>
                          <span className="font-sans text-[12px] text-textSecondary">{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="w-full">
                <Controller
                  control={control}
                  name="techStack"
                  render={({ field }) => (
                    <SmartTagInput
                      label="techStack"
                      value={field.value}
                      onChange={field.onChange}
                      suggestions={TECH_SUGGESTIONS}
                      color="blue"
                      placeholder="Technologies used in this role..."
                    />
                  )}
                />
              </div>

              <div className="flex flex-row gap-[24px] items-center">
                <Controller
                  control={control}
                  name="isPublished"
                  render={({ field }) => (
                    <ToggleSwitch value={field.value} onChange={field.onChange} label="isPublished" />
                  )}
                />
                <div className="flex flex-col w-[80px]">
                  <label className="font-mono text-[11px] text-textMuted mb-[4px]">order</label>
                  <input type="number" {...register('displayOrder', { valueAsNumber: true })} placeholder="0" className="bg-bgRaised border border-border rounded-[4px] font-mono text-[12px] text-textPrimary px-[10px] py-[6px] outline-none focus:border-green w-full" />
                </div>
              </div>

            </div>
          </CollapsibleSection>

          <div className="flex justify-end items-center gap-[12px] mt-[16px] pt-[16px] border-t border-border">
            {(createMutation.isError || updateMutation.isError) && (
              <span className="font-mono text-[11px] text-red mr-auto">Error: mutation failed</span>
            )}
            <button type="button" onClick={() => setIsModalOpen(false)} className="bg-transparent border border-border text-textMuted px-[16px] py-[8px] rounded-[4px] font-mono text-[12px] cursor-pointer hover:border-textMuted">
              Cancel
            </button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-green text-[#0a0c0b] border-none px-[16px] py-[8px] rounded-[4px] font-mono text-[12px] cursor-pointer disabled:opacity-50 min-w-[100px]">
              {editingId ? 'PATCH \u2192' : 'POST \u2192'}
            </button>
          </div>

        </form>
      </AdminModal>

      <ConfirmDelete 
        isOpen={!!deleteId} 
        resourceName="experience" 
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isDeleting={deleteMutation.isPending}
      />
    </>
  );
};
