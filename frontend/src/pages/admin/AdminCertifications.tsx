// Path: src/pages/admin/AdminCertifications.tsx
// Purpose: CRUD page for Certifications
// Dependencies: react, @tanstack/react-query, react-hook-form, zod

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getCertifications, createCertification, updateCertification, deleteCertification } from '../../api/admin';
import { AdminTable } from '../../components/admin/AdminTable';
import { AdminModal } from '../../components/admin/AdminModal';
import { ConfirmDelete } from '../../components/admin/ConfirmDelete';
import { SmartSelect } from '../../components/admin/SmartSelect';
import { ToggleSwitch } from '../../components/admin/ToggleSwitch';
import { CollapsibleSection } from '../../components/admin/CollapsibleSection';
import { ImageUpload } from '../../components/admin/ImageUpload';
import { useToast } from '../../store/uiStore';
import type { ApiError, Certification, CreateCertificationPayload, UpdateCertificationPayload } from '../../types/admin';

const certificationSchema = z.object({
  title: z.string().min(1),
  issuer: z.string().min(1),
  customIssuer: z.string().optional(),
  issueDate: z.string().min(1),
  expiryDate: z.string().optional(),
  credentialId: z.string().optional(),
  credentialUrl: z.union([z.string().url(), z.literal('')]).optional(),
  thumbnailUrl: z.string().optional(),
  isPublished: z.boolean()
});

type CertificationFormInputs = z.infer<typeof certificationSchema>;

export const AdminCertifications: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [noExpiry, setNoExpiry] = useState(false);

  const { data: certsData, isLoading } = useQuery({
    queryKey: ['certifications'],
    queryFn: () => getCertifications({ isPublished: 'all' })
  });
  const certifications = certsData?.data || [];

  const { register, handleSubmit, reset, control, setValue, watch, formState: { errors } } = useForm<CertificationFormInputs>({
    resolver: zodResolver(certificationSchema),
    defaultValues: {
      issuer: '',
      customIssuer: '',
      isPublished: true,
      credentialUrl: '',
      thumbnailUrl: ''
    }
  });

  const issuerValue = watch('issuer');

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
    mutationFn: (data: Record<string, unknown>) => createCertification(data as unknown as CreateCertificationPayload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certifications'] });
      setIsModalOpen(false);
      showToast('Certification created successfully', 'success');
    },
    onError: handleError
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Record<string, unknown> }) => updateCertification(id, data as unknown as UpdateCertificationPayload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certifications'] });
      setIsModalOpen(false);
      showToast('Certification updated successfully', 'success');
    },
    onError: handleError
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCertification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certifications'] });
      setDeleteId(null);
      showToast('Certification deleted', 'success');
    },
    onError: handleError
  });

  const onSubmit = (data: CertificationFormInputs) => {
    const finalIssuer = data.issuer === 'Other' ? data.customIssuer || 'Other' : data.issuer;

    const payload: Record<string, unknown> = {
      title: data.title,
      issuer: finalIssuer,
      issueDate: new Date(data.issueDate).toISOString(),
      expiryDate: noExpiry ? undefined : (data.expiryDate ? new Date(data.expiryDate).toISOString() : undefined),
      credentialId: data.credentialId || '',
      credentialUrl: data.credentialUrl || '',
      thumbnailUrl: data.thumbnailUrl || '',
      isPublished: data.isPublished
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const KNOWN_ISSUERS = ['Amazon Web Services', 'Google Cloud', 'Microsoft Azure', 'MongoDB University', 'Linux Foundation', 'HashiCorp', 'CNCF', 'Coursera', 'Udemy', 'Other'];

  const openNew = () => {
    setNoExpiry(false);
    reset({
      title: '', issuer: '', customIssuer: '', issueDate: '', expiryDate: '', credentialId: '', credentialUrl: '', thumbnailUrl: '', isPublished: true
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEdit = (row: Certification) => {
    const isKnown = KNOWN_ISSUERS.includes(row.issuer);
    setNoExpiry(!row.expiryDate);
    reset({
      title: row.title,
      issuer: isKnown ? row.issuer : 'Other',
      customIssuer: isKnown ? '' : row.issuer,
      issueDate: row.issueDate ? new Date(row.issueDate).toISOString().substring(0,7) : '',
      expiryDate: row.expiryDate ? new Date(row.expiryDate).toISOString().substring(0,7) : '',
      credentialId: row.credentialId || '',
      credentialUrl: row.credentialUrl || '',
      thumbnailUrl: row.thumbnailUrl || '',
      isPublished: row.isPublished
    });
    setEditingId(row._id);
    setIsModalOpen(true);
  };

  const columns = [
    { key: 'title', label: 'Name' },
    { key: 'issuer', label: 'Issuer' },
    { 
      key: 'issueDate', 
      label: 'Issue Date',
      render: (row: Certification) => <span className="font-mono text-[11px] text-textMuted">{new Date(row.issueDate).toLocaleDateString('en-US', {month:'short', year:'numeric'})}</span>
    },
    { 
      key: 'expiryDate', 
      label: 'Expiry',
      render: (row: Certification) => row.expiryDate ? (
        <span className="font-mono text-[11px] text-textMuted">{new Date(row.expiryDate).toLocaleDateString('en-US', {month:'short', year:'numeric'})}</span>
      ) : (
        <span className="font-mono text-[10px] text-green">no expiry</span>
      )
    },

    { 
      key: 'isPublished', 
      label: 'Published',
      render: (row: Certification) => row.isPublished ? (
        <span className="text-green font-mono text-[11px]">yes</span>
      ) : (
        <span className="text-textMuted font-mono text-[11px]">no</span>
      )
    }
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-[16px] mb-[24px]">
        <div>
          <div className="font-mono text-[12px] text-green mb-[4px]">GET /api/v1/certifications &rarr; 200 OK</div>
          <h1 className="font-sans text-[22px] text-textPrimary m-0 font-medium">Certifications</h1>
        </div>
        <button 
          onClick={openNew}
          className="border border-green text-green bg-transparent font-mono text-[12px] px-[16px] py-[8px] rounded-[4px] hover:bg-[rgba(74,222,128,0.08)] cursor-pointer transition-colors"
        >
          + New Certification
        </button>
      </div>

      <AdminTable 
        columns={columns}
        data={certifications}
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={(row) => setDeleteId(row._id)}
      />

      <AdminModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="certification" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[16px]">
          
          <div className="flex flex-col w-full">
            <label className="font-mono text-[11px] text-textMuted mb-[4px]">certification name *</label>
            <input {...register('title')} placeholder="e.g. AWS Solutions Architect – Associate" className="bg-bgRaised border border-border rounded-[4px] font-mono text-[12px] text-textPrimary px-[10px] py-[6px] outline-none focus:border-green w-full" />
            {errors.title && <span className="font-mono text-[10px] text-red mt-[3px]">{errors.title.message}</span>}
          </div>

          <div className="flex flex-col w-full gap-[8px]">
            <Controller
              control={control}
              name="issuer"
              render={({ field }) => (
                <SmartSelect
                  label="issuer *"
                  value={field.value}
                  onChange={(val) => {
                    field.onChange(val);
                    if (val !== 'Other') setValue('customIssuer', '');
                  }}
                  options={[
                    { value:'Amazon Web Services',  label:'Amazon Web Services',  description:'AWS certifications' },
                    { value:'Google Cloud',         label:'Google Cloud',         description:'GCP certifications' },
                    { value:'Microsoft Azure',      label:'Microsoft Azure',      description:'Azure certifications' },
                    { value:'MongoDB University',   label:'MongoDB University',   description:'MongoDB certifications' },
                    { value:'Linux Foundation',     label:'Linux Foundation',     description:'CKA, CKAD, CKS' },
                    { value:'HashiCorp',            label:'HashiCorp',            description:'Terraform, Vault' },
                    { value:'CNCF',                 label:'CNCF',                 description:'Cloud Native Computing Foundation' },
                    { value:'Coursera',             label:'Coursera',             description:'Online courses' },
                    { value:'Udemy',                label:'Udemy',                description:'Online courses' },
                    { value:'Other',                label:'Other',                description:'Type custom issuer below' }
                  ]}
                />
              )}
            />
            
            {issuerValue === 'Other' && (
              <div className="flex flex-col mt-[4px]">
                <label className="font-mono text-[11px] text-textMuted mb-[4px]">custom issuer name *</label>
                <input {...register('customIssuer')} placeholder="e.g. JetBrains Academy" className="bg-bgRaised border border-border rounded-[4px] font-mono text-[12px] text-textPrimary px-[10px] py-[6px] outline-none focus:border-green w-full" />
              </div>
            )}
          </div>

          <div className="flex flex-col w-full">
            <label className="font-mono text-[11px] text-textMuted mb-[4px]">issueDate *</label>
            <input type="month" {...register('issueDate')} className="bg-bgRaised border border-border rounded-[4px] font-mono text-[12px] text-textPrimary px-[10px] py-[6px] outline-none focus:border-green w-full" />
            {errors.issueDate && <span className="font-mono text-[10px] text-red mt-[3px]">{errors.issueDate.message}</span>}
          </div>

          <div className="w-full flex flex-col gap-[8px]">
            <ToggleSwitch
              label="does not expire"
              value={noExpiry}
              onChange={(val) => {
                setNoExpiry(val);
                if (val) setValue('expiryDate', '');
              }}
            />

            {!noExpiry && (
              <div className="flex flex-col mt-[4px]">
                <label className="font-mono text-[11px] text-textMuted mb-[4px]">expiryDate</label>
                <input type="month" {...register('expiryDate')} className="bg-bgRaised border border-border rounded-[4px] font-mono text-[12px] text-textPrimary px-[10px] py-[6px] outline-none focus:border-green w-full" />
              </div>
            )}
          </div>

          <div className="w-full">
            <Controller
              control={control}
              name="thumbnailUrl"
              render={({ field }) => (
                <ImageUpload
                  label="certificate image"
                  value={field.value}
                  onChange={field.onChange}
                  aspectRatio="16/9"
                />
              )}
            />
          </div>

          <CollapsibleSection title="Optional Details">
            <div className="flex flex-col gap-[14px]">
              <div className="flex flex-col w-full">
                <label className="font-mono text-[11px] text-textMuted mb-[4px]">credentialId</label>
                <input {...register('credentialId')} placeholder="e.g. ABC-123-XYZ" className="bg-bgRaised border border-border rounded-[4px] font-mono text-[12px] text-textPrimary px-[10px] py-[6px] outline-none focus:border-green w-full" />
                <div className="font-mono text-[10px] text-textMuted mt-[4px]">// certificate ID shown on credential</div>
              </div>

              <div className="flex flex-col w-full">
                <label className="font-mono text-[11px] text-textMuted mb-[4px]">credentialUrl</label>
                <input {...register('credentialUrl')} placeholder="https://credentials.example.com/..." className="bg-bgRaised border border-border rounded-[4px] font-mono text-[12px] text-textPrimary px-[10px] py-[6px] outline-none focus:border-green w-full" />
                <div className="font-mono text-[10px] text-textMuted mt-[4px]">// link to verify this certificate online</div>
                {errors.credentialUrl && <span className="font-mono text-[10px] text-red mt-[3px]">{errors.credentialUrl.message}</span>}
              </div>

              <div className="flex flex-row gap-[24px] items-center">
                <Controller
                  control={control}
                  name="isPublished"
                  render={({ field }) => (
                    <ToggleSwitch value={field.value} onChange={field.onChange} label="isPublished" />
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
        resourceName="certification" 
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isDeleting={deleteMutation.isPending}
      />
    </>
  );
};
