// Path: src/pages/admin/AdminSkills.tsx
// Purpose: CRUD page for Skills
// Dependencies: react, @tanstack/react-query, react-hook-form, zod

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getSkills, createSkill, updateSkill, deleteSkill } from '../../api/admin';
import { AdminTable } from '../../components/admin/AdminTable';
import { AdminModal } from '../../components/admin/AdminModal';
import { ConfirmDelete } from '../../components/admin/ConfirmDelete';
import { ToggleSwitch } from '../../components/admin/ToggleSwitch';
import { SmartSelect } from '../../components/admin/SmartSelect';
import { CollapsibleSection } from '../../components/admin/CollapsibleSection';
import { useToast } from '../../store/uiStore';
import type { ApiError, Skill, CreateSkillPayload, UpdateSkillPayload } from '../../types/admin';

const skillSchema = z.object({
  name: z.string().min(1),
  category: z.string(),
  proficiency: z.union([z.string(), z.number()]),
  displayOrder: z.number().optional(),
  isPublished: z.boolean()
});

type SkillFormInputs = z.infer<typeof skillSchema>;

interface AxiosErrorResponse {
  response?: {
    data?: {
      errors?: ApiError[];
      message?: string;
      details?: Array<{ message: string }>;
    };
  };
}

export const AdminSkills: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: skillsData, isLoading } = useQuery({
    queryKey: ['skills'],
    queryFn: () => getSkills({ isPublished: 'all' })
  });
  const skills = skillsData?.data || [];

  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm<SkillFormInputs>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      category: 'backend',
      proficiency: 50,
      isPublished: true,
      displayOrder: 0
    }
  });

  const proficiencyValue = Number(watch('proficiency') || 50);

  const handleError = (error: unknown) => {
    const axiosError = error as AxiosErrorResponse;
    const message = axiosError?.response?.data?.details?.[0]?.message
      ?? axiosError?.response?.data?.errors?.[0]?.message
      ?? axiosError?.response?.data?.message
      ?? 'An error occurred. Please try again.';
    showToast(message, 'error');
    console.error('API Error:', axiosError?.response?.data);
  };

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => createSkill(data as unknown as CreateSkillPayload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      setIsModalOpen(false);
      showToast('Skill created successfully', 'success');
    },
    onError: handleError
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Record<string, unknown> }) => updateSkill(id, data as unknown as UpdateSkillPayload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      setIsModalOpen(false);
      showToast('Skill updated successfully', 'success');
    },
    onError: handleError
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSkill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      setDeleteId(null);
      showToast('Skill deleted', 'success');
    },
    onError: handleError
  });

  const onSubmit = (data: SkillFormInputs) => {
    const payload: Record<string, unknown> = {
      name: data.name,
      category: data.category,
      proficiency: Number(data.proficiency),
      displayOrder: data.displayOrder || 0,
      isPublished: data.isPublished
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const openNew = () => {
    reset({
      name: '', category: 'backend', proficiency: 50, isPublished: true, displayOrder: 0
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEdit = (row: Skill) => {
    reset({
      name: row.name,
      category: row.category,
      proficiency: row.proficiency,
      isPublished: row.isPublished,
      displayOrder: row.displayOrder || 0
    });
    setEditingId(row._id);
    setIsModalOpen(true);
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { 
      key: 'category', 
      label: 'Category',
      render: (row: Skill) => {
        let colorClass = 'text-textMuted bg-[rgba(255,255,255,0.1)]';
        if (row.category === 'database') colorClass = 'text-blue bg-[rgba(96,165,250,0.12)]';
        if (row.category === 'devops') colorClass = 'text-amber bg-[rgba(251,191,36,0.12)]';
        if (row.category === 'tools') colorClass = 'text-purple bg-[rgba(192,132,252,0.12)]';
        
        return <span className={`font-mono text-[10px] px-[8px] py-[2px] rounded-[12px] ${colorClass}`}>{row.category}</span>;
      }
    },
    { 
      key: 'proficiency', 
      label: 'Proficiency',
      render: (row: Skill) => {
        let barColor = 'var(--text-muted)';
        if (row.category === 'database') barColor = 'var(--blue)';
        if (row.category === 'devops') barColor = 'var(--amber)';
        if (row.category === 'tools') barColor = 'var(--purple)';

        return (
          <div className="flex flex-row items-center gap-[8px]">
            <div className="w-[60px] h-[4px] bg-[rgba(255,255,255,0.06)] rounded-[2px] overflow-hidden">
              <div 
                className="h-full rounded-[2px]" 
                style={{ width: `${row.proficiency}%`, backgroundColor: barColor }}
              />
            </div>
            <span className="font-mono text-[10px] text-textMuted">{row.proficiency}%</span>
          </div>
        );
      }
    },
    { 
      key: 'isPublished', 
      label: 'Published',
      render: (row: Skill) => row.isPublished ? (
        <span className="text-green font-mono text-[11px]">yes</span>
      ) : (
        <span className="text-textMuted font-mono text-[11px]">no</span>
      )
    }
  ];

  const getSliderAccent = (val: number) => {
    if (val <= 40) return 'var(--red)';
    if (val <= 70) return 'var(--amber)';
    return 'var(--green)';
  };
  const currentSliderColor = getSliderAccent(proficiencyValue);

  return (
    <>
      <div className="flex justify-between items-center mb-[24px]">
        <div>
          <div className="font-mono text-[12px] text-green mb-[4px]">GET /api/v1/skills &rarr; 200 OK</div>
          <h1 className="font-sans text-[22px] text-textPrimary m-0 font-medium">Skills</h1>
        </div>
        <button 
          onClick={openNew}
          className="border border-green text-green bg-transparent font-mono text-[12px] px-[16px] py-[8px] rounded-[4px] hover:bg-[rgba(74,222,128,0.08)] cursor-pointer transition-colors"
        >
          + New Skill
        </button>
      </div>

      <AdminTable 
        columns={columns}
        data={skills}
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={(row) => setDeleteId(row._id)}
      />

      <AdminModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="skill" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[16px]">
          
          <div className="flex flex-col w-full">
            <label className="font-mono text-[11px] text-textMuted mb-[4px]">name *</label>
            <input {...register('name')} placeholder="e.g. Node.js, TypeScript, Docker..." className="bg-bgRaised border border-border rounded-[4px] font-mono text-[12px] text-textPrimary px-[10px] py-[6px] outline-none focus:border-green w-full" />
            {errors.name && <span className="font-mono text-[10px] text-red mt-[3px]">{errors.name.message}</span>}
          </div>

          <div className="w-full">
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <SmartSelect
                  label="category *"
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value:'frontend', label:'frontend', description:'Frontend technologies — React, Vue, Angular' },
                    { value:'backend',  label:'backend',  description:'Backend technologies — Node.js, Express, APIs' },
                    { value:'database', label:'database', description:'Databases — MongoDB, PostgreSQL, Redis' },
                    { value:'devops',   label:'devops',   description:'DevOps tools — Docker, Kubernetes, CI/CD' },
                    { value:'tools',    label:'tools',    description:'Developer tools — Git, Postman, VSCode' },
                    { value:'other',    label:'other',    description:'Other technologies' }
                  ]}
                />
              )}
            />
          </div>

          <div className="flex flex-col w-full mt-[4px]">
            <label className="font-mono text-[11px] text-textMuted mb-[8px]">
              proficiency * — <span style={{ color: currentSliderColor }}>{proficiencyValue}%</span>
            </label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              step="1"
              {...register('proficiency')} 
              className="w-full"
              style={{ accentColor: currentSliderColor }}
            />
            <div className="h-[4px] bg-[rgba(255,255,255,0.06)] rounded-[2px] w-full mt-[8px] overflow-hidden">
              <div 
                className="h-full rounded-[2px] transition-all duration-150" 
                style={{ width: `${proficiencyValue}%`, backgroundColor: currentSliderColor }}
              />
            </div>
            <div className="flex justify-between items-center font-mono text-[9px] text-textMuted mt-[6px]">
              <span>0 — beginner</span>
              <span>50 — intermediate</span>
              <span>80 — advanced</span>
              <span>100 — expert</span>
            </div>
          </div>

          <CollapsibleSection title="Optional Details">
            <div className="flex flex-col gap-[14px]">

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
        resourceName="skill" 
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isDeleting={deleteMutation.isPending}
      />
    </>
  );
};
