export interface Template {
  id: string;
  name: string;
  description: string | null;
  niche: string;
  thumbnail: string | null;
  isBuiltIn: boolean;
  isPublished: boolean;
  composition: string;
  defaultCaptionStyleId: string | null;
  defaultEffects: string | null;
  defaultTransitions: string | null;
  colorPalette: string | null;
  musicConfig: string | null;
  hookConfig: string | null;
  ctaConfig: string | null;
  layoutConfig: string | null;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  niche: string;
  composition: string;
  defaultCaptionStyleId?: string;
  defaultEffects?: string;
  defaultTransitions?: string;
  colorPalette?: string;
  musicConfig?: string;
  hookConfig?: string;
  ctaConfig?: string;
  layoutConfig?: string;
}
