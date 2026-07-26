// Path: src/pages/admin/AdminArticles.tsx
// Purpose: CRUD page for Articles
// Dependencies: react, @tanstack/react-query, react-hook-form, zod

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getArticles, createArticle, updateArticle, deleteArticle } from '../../api/admin';
import { AdminTable } from '../../components/admin/AdminTable';
import { AdminModal } from '../../components/admin/AdminModal';
import { ConfirmDelete } from '../../components/admin/ConfirmDelete';
import { SmartTagInput } from '../../components/admin/SmartTagInput';
import { ARTICLE_TAG_SUGGESTIONS } from '../../components/admin/tagSuggestions';
import { CollapsibleSection } from '../../components/admin/CollapsibleSection';
import { ToggleSwitch } from '../../components/admin/ToggleSwitch';
import { SlugPreview } from '../../components/admin/SlugPreview';
import { useToast } from '../../store/uiStore';
import type { ApiError, Article, CreateArticlePayload, UpdateArticlePayload } from '../../types/admin';

const articleSchema = z.object({
  title: z.string().min(1),
  excerpt: z.string().min(1).max(500),
  content: z.string().min(1),
  tags: z.array(z.string()),
  readTimeMinutes: z.number().optional(),
  isPublished: z.boolean()
});

type ArticleFormInputs = z.infer<typeof articleSchema>;

interface AxiosErrorResponse {
  response?: {
    data?: {
      errors?: ApiError[];
      message?: string;
      details?: Array<{ message: string }>;
    };
  };
}

export const AdminArticles: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: articlesData, isLoading } = useQuery({
    queryKey: ['articles'],
    queryFn: () => getArticles({ isPublished: 'all' })
  });
  const articles = articlesData?.data || [];

  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm<ArticleFormInputs>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      tags: [],
      isPublished: false,
      content: '',
      excerpt: '',
      readTimeMinutes: undefined
    }
  });

  const watchedTitle = watch('title') || '';
  const content = watch('content') || '';
  const charCount = content.length;
  const readTime = Math.max(1, Math.ceil(content.split(/\s+/).filter(Boolean).length / 200));

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
    mutationFn: (data: Record<string, unknown>) => createArticle(data as unknown as CreateArticlePayload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      setIsModalOpen(false);
      showToast('Article created successfully', 'success');
    },
    onError: handleError
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Record<string, unknown> }) => updateArticle(id, data as unknown as UpdateArticlePayload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      setIsModalOpen(false);
      showToast('Article updated successfully', 'success');
    },
    onError: handleError
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      setDeleteId(null);
      showToast('Article deleted', 'success');
    },
    onError: handleError
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string, isPublished: boolean }) => updateArticle(id, { isPublished }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      showToast('Article status updated', 'success');
    },
    onError: handleError
  });

  const onSubmit = (data: ArticleFormInputs) => {
    const payload: Record<string, unknown> = {
      title: data.title,
      excerpt: data.excerpt,
      content: data.content,
      tags: data.tags,
      readTimeMinutes: data.readTimeMinutes || readTime,
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
      title: '', excerpt: '', content: '', tags: [], isPublished: false, readTimeMinutes: undefined
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEdit = (row: Article) => {
    reset({
      title: row.title,
      excerpt: row.excerpt || '',
      content: row.content,
      tags: row.tags || [],
      isPublished: row.isPublished,
      readTimeMinutes: row.readTimeMinutes
    });
    setEditingId(row._id);
    setIsModalOpen(true);
  };

  const columns = [
    { key: 'title', label: 'Title' },
    { 
      key: 'tags', 
      label: 'Tags',
      render: (row: Article) => {
        const tags = row.tags || [];
        return (
          <div className="flex gap-[4px]">
            {tags.slice(0, 2).map((t: string) => (
              <span key={t} className="bg-bgRaised border border-border rounded-[4px] px-[6px] py-[2px] font-mono text-[10px] text-textMuted">{t}</span>
            ))}
            {tags.length > 2 && <span className="font-mono text-[10px] text-textMuted px-[4px]">+{tags.length - 2}</span>}
          </div>
        )
      }
    },
    { 
      key: 'readTime', 
      label: 'Read Time',
      render: (row: Article) => <span className="font-mono text-[11px] text-textMuted">{row.readTimeMinutes} min</span>
    },
    { 
      key: 'isPublished', 
      label: 'Status',
      render: (row: Article) => row.isPublished ? (
        <span className="bg-[rgba(74,222,128,0.1)] text-green px-[8px] py-[2px] rounded-[12px] font-mono text-[10px]">● published</span>
      ) : (
        <span className="bg-[rgba(251,191,36,0.1)] text-amber px-[8px] py-[2px] rounded-[12px] font-mono text-[10px]">● draft</span>
      )
    },
    {
      key: 'publishedAt',
      label: 'Published At',
      render: (row: Article) => <span className="font-mono text-[11px] text-textMuted">{row.publishedAt ? new Date(row.publishedAt).toLocaleDateString() : '—'}</span>
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: Article) => (
        <div className="flex items-center gap-[16px]">
          <button
            onClick={() => openEdit(row)}
            className="font-mono text-[11px] text-textMuted bg-transparent border-none cursor-pointer hover:text-textPrimary"
          >
            edit
          </button>
          
          <button
            onClick={() => togglePublishMutation.mutate({ id: row._id, isPublished: !row.isPublished })}
            className={`font-mono text-[11px] bg-transparent border-none cursor-pointer ${row.isPublished ? 'text-amber hover:text-[rgba(251,191,36,0.8)]' : 'text-green hover:text-[rgba(74,222,128,0.8)]'}`}
          >
            {row.isPublished ? 'unpublish' : '→ publish'}
          </button>

          <button
            onClick={() => setDeleteId(row._id)}
            className="font-mono text-[11px] text-red bg-transparent border-none cursor-pointer hover:text-[rgba(248,113,113,0.8)]"
          >
            delete
          </button>
        </div>
      )
    }
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-[16px] mb-[24px]">
        <div>
          <div className="font-mono text-[12px] text-green mb-[4px]">GET /api/v1/articles &rarr; 200 OK</div>
          <h1 className="font-sans text-[22px] text-textPrimary m-0 font-medium">Articles</h1>
        </div>
        <button 
          onClick={openNew}
          className="border border-green text-green bg-transparent font-mono text-[12px] px-[16px] py-[8px] rounded-[4px] hover:bg-[rgba(74,222,128,0.08)] cursor-pointer transition-colors"
        >
          + New Article
        </button>
      </div>

      <AdminTable 
        columns={columns}
        data={articles}
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={(row) => setDeleteId(row._id)}
      />

      <AdminModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="article" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[16px]">
          
          <div className="flex flex-col w-full">
            <label className="font-mono text-[11px] text-textMuted mb-[4px]">title *</label>
            <input {...register('title')} placeholder="Article title..." className="bg-bgRaised border border-border rounded-[4px] font-mono text-[12px] text-textPrimary px-[10px] py-[6px] outline-none focus:border-green w-full" />
            <SlugPreview title={watchedTitle} />
            {errors.title && <span className="font-mono text-[10px] text-red mt-[3px]">{errors.title.message}</span>}
          </div>

          <div className="flex flex-col w-full">
            <label className="font-mono text-[11px] text-textMuted mb-[4px]">excerpt * <span className="text-textMuted">(shown in article cards)</span></label>
            <textarea {...register('excerpt')} rows={3} placeholder="Brief summary of the article (max 500 chars)..." className="bg-bgRaised border border-border rounded-[4px] font-mono text-[12px] text-textPrimary px-[10px] py-[6px] outline-none focus:border-green resize-none w-full" />
            {errors.excerpt && <span className="font-mono text-[10px] text-red mt-[3px]">{errors.excerpt.message}</span>}
          </div>

          <div className="flex flex-col w-full">
            <div className="font-mono text-[10px] text-textMuted py-[8px]">
              // markdown supported · # Heading · **bold** · `code` · ```codeblock``` · &gt; quote · - list
            </div>
            <textarea 
              {...register('content')} 
              rows={16} 
              placeholder={"Write your article in Markdown...\n\n## Introduction\n\nStart writing here..."} 
              className="bg-bgRaised border border-border rounded-[4px] font-mono text-[12px] text-textPrimary p-[10px] outline-none focus:border-green min-h-[320px]" 
              style={{ resize: 'vertical' }}
            />
            {errors.content && <span className="font-mono text-[10px] text-red mt-[3px]">{errors.content.message}</span>}
            
            <div className="flex flex-col sm:flex-row justify-between mt-[6px] gap-[4px] sm:gap-0">
              <span className="font-mono text-[10px] text-textMuted">{charCount} characters</span>
              <span className="font-mono text-[10px] text-textMuted">~{readTime} min read</span>
            </div>
          </div>

          <div className="w-full">
            <Controller
              control={control}
              name="tags"
              render={({ field }) => (
                <SmartTagInput
                  label="tags"
                  value={field.value}
                  onChange={field.onChange}
                  suggestions={ARTICLE_TAG_SUGGESTIONS}
                  color="blue"
                  placeholder="Pick category or type custom tag..."
                />
              )}
            />
          </div>

          <CollapsibleSection title="Optional Details">
            <div className="flex flex-col gap-[14px]">
              <div className="flex flex-col w-full">
                <label className="font-mono text-[11px] text-textMuted mb-[4px]">readTimeMinutes (override)</label>
                <input type="number" {...register('readTimeMinutes', { valueAsNumber: true })} placeholder="Leave empty to auto-calculate" className="bg-bgRaised border border-border rounded-[4px] font-mono text-[12px] text-textPrimary px-[10px] py-[6px] outline-none focus:border-green w-full" />
                <div className="font-mono text-[10px] text-textMuted mt-[4px]">// overrides auto-calculation based on word count</div>
              </div>

              <div className="w-full">
                <Controller
                  control={control}
                  name="isPublished"
                  render={({ field }) => (
                    <>
                      <ToggleSwitch label="isPublished — publish immediately on save" value={field.value} onChange={field.onChange} />
                      {field.value && (
                        <div className="font-mono text-[10px] text-amber mt-[6px]">
                          // warning: article will be visible to all visitors immediately
                        </div>
                      )}
                    </>
                  )}
                />
              </div>
            </div>
          </CollapsibleSection>

          <div className="flex flex-col-reverse md:flex-row justify-end items-stretch md:items-center gap-[12px] mt-[16px] pt-[16px] border-t border-border">
            {(createMutation.isError || updateMutation.isError) && (
              <span className="font-mono text-[11px] text-red mr-auto text-center md:text-left mb-[8px] md:mb-0">Error: mutation failed</span>
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
        resourceName="article" 
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isDeleting={deleteMutation.isPending}
      />
    </>
  );
};
