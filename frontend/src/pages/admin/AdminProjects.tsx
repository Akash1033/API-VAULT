// Path: src/pages/admin/AdminProjects.tsx
// Purpose: CRUD page for Projects
// Dependencies: react, @tanstack/react-query, react-hook-form, zod

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getProjects, createProject, updateProject, deleteProject } from '../../api/admin';
import { AdminTable } from '../../components/admin/AdminTable';
import { AdminModal } from '../../components/admin/AdminModal';
import { ConfirmDelete } from '../../components/admin/ConfirmDelete';
import { ToggleSwitch } from '../../components/admin/ToggleSwitch';
import { SlugPreview } from '../../components/admin/SlugPreview';
import { SmartTagInput } from '../../components/admin/SmartTagInput';
import { TECH_SUGGESTIONS } from '../../components/admin/tagSuggestions';
import { ImageUpload } from '../../components/admin/ImageUpload';
import { CollapsibleSection } from '../../components/admin/CollapsibleSection';
import { useToast } from '../../store/uiStore';
import type { ApiError, Project, CreateProjectPayload, UpdateProjectPayload } from '../../types/admin';

const projectSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(1).max(500),
  technologies: z.array(z.string()).min(1),
  thumbnailUrl: z.string().optional(),
  isPublished: z.boolean(),
  featured: z.boolean(),
  githubUrl: z.union([z.string().url(), z.literal('')]).optional(),
  liveUrl: z.union([z.string().url(), z.literal('')]).optional(),
  displayOrder: z.number().optional()
});

type ProjectFormInputs = z.infer<typeof projectSchema>;

interface AxiosErrorResponse {
  response?: {
    data?: {
      errors?: ApiError[];
      message?: string;
      details?: Array<{ message: string }>;
    };
  };
}

export const AdminProjects: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjects()
  });
  const projects = projectsData?.data || [];

  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm<ProjectFormInputs>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      technologies: [],
      isPublished: false,
      featured: false,
      displayOrder: 0,
      description: '',
      githubUrl: '',
      liveUrl: '',
      thumbnailUrl: ''
    }
  });

  const watchedTitle = watch('title') || '';
  const descriptionLength = (watch('description') || '').length;

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
    mutationFn: (data: Record<string, unknown>) => createProject(data as unknown as CreateProjectPayload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsModalOpen(false);
      showToast('Project created successfully', 'success');
    },
    onError: handleError
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Record<string, unknown> }) => updateProject(id, data as unknown as UpdateProjectPayload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsModalOpen(false);
      showToast('Project updated successfully', 'success');
    },
    onError: handleError
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDeleteId(null);
      showToast('Project deleted', 'success');
    },
    onError: handleError
  });

  const onSubmit = (data: ProjectFormInputs) => {
    const payload: Record<string, unknown> = {
      title: data.title,
      description: data.description,
      technologies: data.technologies,
      thumbnailUrl: data.thumbnailUrl || '',
      isPublished: data.isPublished,
      featured: data.featured,
      githubUrl: data.githubUrl || '',
      liveUrl: data.liveUrl || '',
      displayOrder: data.displayOrder || 0
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const openNew = () => {
    reset({
      title: '', description: '', technologies: [], thumbnailUrl: '', isPublished: false, featured: false, displayOrder: 0, githubUrl: '', liveUrl: ''
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEdit = (row: Project) => {
    reset({
      title: row.title,
      description: row.description,
      technologies: row.technologies || [],
      thumbnailUrl: row.thumbnailUrl || '',
      isPublished: row.isPublished,
      featured: row.featured,
      githubUrl: row.githubUrl || '',
      liveUrl: row.liveUrl || '',
      displayOrder: row.displayOrder || 0
    });
    setEditingId(row._id);
    setIsModalOpen(true);
  };

  const columns = [
    { 
      key: 'imageUrl', 
      label: 'Image',
      render: (row: Project) => {
        const url = row.thumbnailUrl;
        return url ? (
          <img src={url} alt={row.title} width={48} height={32} style={{objectFit:'cover', borderRadius:3, border:'1px solid var(--border)'}} />
        ) : (
          <span className="font-mono text-[9px] text-textMuted flex items-center justify-center w-[48px] h-[32px] bg-bgRaised border border-border rounded-[3px]">no img</span>
        );
      }
    },
    { key: 'title', label: 'Title' },
    { 
      key: 'technologies', 
      label: 'Tech Stack',
      render: (row: Project) => {
        const techs = row.technologies || [];
        return (
          <div className="flex gap-[4px]">
            {techs.slice(0, 3).map((t: string) => (
              <span key={t} className="bg-bgRaised border border-border rounded-[4px] px-[6px] py-[2px] font-mono text-[10px] text-textMuted">{t}</span>
            ))}
            {techs.length > 3 && <span className="font-mono text-[10px] text-textMuted px-[4px]">+{techs.length - 3} more</span>}
          </div>
        )
      }
    },
    { 
      key: 'isPublished', 
      label: 'Status',
      render: (row: Project) => row.isPublished ? (
        <span className="bg-[rgba(74,222,128,0.1)] text-green px-[8px] py-[2px] rounded-[12px] font-mono text-[10px]">● live</span>
      ) : (
        <span className="bg-[rgba(251,191,36,0.1)] text-amber px-[8px] py-[2px] rounded-[12px] font-mono text-[10px]">● draft</span>
      )
    },
    {
      key: 'featured',
      label: 'Featured',
      render: (row: Project) => row.featured ? (
        <span className="text-amber font-mono text-[11px]">★ yes</span>
      ) : (
        <span className="text-textMuted font-mono text-[11px]">no</span>
      )
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (row: Project) => <span className="font-mono text-[11px] text-textMuted">{new Date(row.createdAt).toLocaleDateString()}</span>
    }
  ];

  const githubUrl = watch('githubUrl');
  const liveUrl = watch('liveUrl');
  const order = watch('displayOrder');

  const filledOptional = [githubUrl, liveUrl, order].filter(Boolean).length;

  return (
    <>
      <div className="flex justify-between items-center mb-[24px]">
        <div>
          <div className="font-mono text-[12px] text-green mb-[4px]">GET /api/v1/projects &rarr; 200 OK</div>
          <h1 className="font-sans text-[22px] text-textPrimary m-0 font-medium">Projects</h1>
        </div>
        <button 
          onClick={openNew}
          className="border border-green text-green bg-transparent font-mono text-[12px] px-[16px] py-[8px] rounded-[4px] hover:bg-[rgba(74,222,128,0.08)] cursor-pointer transition-colors"
        >
          + New Project
        </button>
      </div>

      <AdminTable 
        columns={columns}
        data={projects}
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={(row) => setDeleteId(row._id)}
      />

      <AdminModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="project" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[14px]">
          
          <div className="flex flex-col gap-[4px] grid-cols-1">
            <label className="font-mono text-[11px] text-textMuted">title *</label>
            <input {...register('title')} className="bg-bgRaised border border-border rounded-[4px] font-mono text-[12px] text-textPrimary px-[10px] py-[6px] outline-none focus:border-green w-full" />
            <SlugPreview title={watchedTitle} />
            {errors.title && <span className="font-mono text-[10px] text-red mt-[3px]">{errors.title.message}</span>}
          </div>


          <div className="flex flex-col w-full">
            <label className="font-mono text-[11px] text-textMuted mb-[4px]">description *</label>
            <textarea {...register('description')} rows={4} className="bg-bgRaised border border-border rounded-[4px] font-mono text-[12px] text-textPrimary px-[10px] py-[6px] outline-none focus:border-green resize-none w-full" />
            <div className="font-mono text-[10px] text-textMuted text-right mt-[4px]">{descriptionLength}/500</div>
            {errors.description && <span className="font-mono text-[10px] text-red mt-[3px]">{errors.description.message}</span>}
          </div>

          <div className="w-full">
            <Controller
              control={control}
              name="technologies"
              render={({ field }) => (
                <SmartTagInput
                  label="techStack *"
                  value={field.value}
                  onChange={field.onChange}
                  suggestions={TECH_SUGGESTIONS}
                  color="green"
                  placeholder="Pick or type technology..."
                />
              )}
            />
            <div className="font-mono text-[10px] text-textMuted mt-[4px]">// select from list or type custom &rarr; Enter</div>
            {errors.technologies && <span className="font-mono text-[10px] text-red mt-[3px]">{errors.technologies.message}</span>}
          </div>

          <div className="w-full">
            <Controller
              control={control}
              name="thumbnailUrl"
              render={({ field }) => (
                <ImageUpload
                  label="project image"
                  value={field.value}
                  onChange={field.onChange}
                  aspectRatio="16/9"
                />
              )}
            />
          </div>

          <div className="flex flex-row gap-[24px] py-[12px]">
            <Controller
              control={control}
              name="isPublished"
              render={({ field }) => (
                <ToggleSwitch value={field.value} onChange={field.onChange} label="isPublished" />
              )}
            />
            <Controller
              control={control}
              name="featured"
              render={({ field }) => (
                <ToggleSwitch value={field.value} onChange={field.onChange} label="isFeatured" />
              )}
            />
          </div>

          <CollapsibleSection title="Optional Details" defaultOpen={false} badge={filledOptional > 0 ? `${filledOptional} filled` : undefined}>
            <div className="flex flex-col gap-[14px]">
              
              <div className="grid grid-cols-2 gap-[12px]">
                <div className="flex flex-col">
                  <label className="font-mono text-[11px] text-textMuted mb-[4px]">githubUrl</label>
                  <input {...register('githubUrl')} placeholder="https://github.com/Akash1033/..." className="bg-bgRaised border border-border rounded-[4px] font-mono text-[12px] text-textPrimary px-[10px] py-[6px] outline-none focus:border-green w-full" />
                  {errors.githubUrl && <span className="font-mono text-[10px] text-red mt-[3px]">{errors.githubUrl.message}</span>}
                </div>
                <div className="flex flex-col">
                  <label className="font-mono text-[11px] text-textMuted mb-[4px]">liveUrl</label>
                  <input {...register('liveUrl')} placeholder="https://..." className="bg-bgRaised border border-border rounded-[4px] font-mono text-[12px] text-textPrimary px-[10px] py-[6px] outline-none focus:border-green w-full" />
                  {errors.liveUrl && <span className="font-mono text-[10px] text-red mt-[3px]">{errors.liveUrl.message}</span>}
                </div>
              </div>


              <div className="flex flex-col w-[100px]">
                <label className="font-mono text-[11px] text-textMuted mb-[4px]">order</label>
                <input type="number" {...register('displayOrder', { valueAsNumber: true })} placeholder="0" className="bg-bgRaised border border-border rounded-[4px] font-mono text-[12px] text-textPrimary px-[10px] py-[6px] outline-none focus:border-green w-full" />
                <div className="font-mono text-[10px] text-textMuted mt-[4px]">// lower number = appears first</div>
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
        resourceName="project" 
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isDeleting={deleteMutation.isPending}
      />
    </>
  );
};
