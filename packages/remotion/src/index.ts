import { registerRoot } from 'remotion';
import { Root } from './Root';

registerRoot(Root);

// Re-export compositions and components for use in @clip/app
export { ReelComposition, type ReelProps, type SceneData } from './compositions/ReelComposition';
export { FeedComposition, type FeedProps } from './compositions/FeedComposition';
export { StoryComposition, type StoryProps } from './compositions/StoryComposition';
export { AnimatedCaption, type CaptionWord, type CaptionStyleConfig } from './components/AnimatedCaption';
export { KaraokeCaption } from './components/KaraokeCaption';
export { PopCaption } from './components/PopCaption';
export { GlowCaption } from './components/GlowCaption';
export { ZoomEffect, type ZoomConfig } from './components/ZoomEffect';
export { Transition } from './components/Transition';
export { ProgressBar } from './components/ProgressBar';
export { CallToAction, type CTAConfig } from './components/CallToAction';
