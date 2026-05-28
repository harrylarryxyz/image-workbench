export type MaskEditorProps = {
  imageUrl?: string | null;
  onMaskReady: (file: File) => void;
};

export type Stroke = { points: number[] };
export type Dimensions = { naturalWidth: number; naturalHeight: number; displayWidth: number; displayHeight: number };
