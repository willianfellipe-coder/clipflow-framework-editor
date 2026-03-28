export type ProjectStatus =
  | 'draft'
  | 'transcribing'
  | 'analyzing'
  | 'editing'
  | 'rendering'
  | 'done'
  | 'error';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  sourceVideoPath: string;
  sourceVideoMeta: string | null;
  thumbnailPath: string | null;
  templateId: string | null;
  nicheId: string | null;
  settings: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  sourceVideoPath: string;
  templateId?: string;
  nicheId?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  templateId?: string;
  nicheId?: string;
  settings?: string;
}
