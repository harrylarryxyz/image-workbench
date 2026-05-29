import { VisualStageClient } from './VisualStageClient';

export const metadata = {
  title: 'Visual Stage — Image Workbench',
  description: 'Route-isolated Visual Stage for Creation Case exploration.',
};

export default function VisualStagePage() {
  return <div className="full-bleed-page immersive-visual-stage-page"><VisualStageClient /></div>;
}
