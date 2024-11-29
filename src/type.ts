export type Html2PdfOptions = {
  filename: string;
  splitClass: string;
  onSplitBefore?: (el: HTMLElement) => void;
  onSplitAfter?: () => void;
  nextPageHeaderMargin?: number;
  specialSplitClass?: string[];
  specialSplitTag?: string[];
  excludeSplitTag?: string[];
};

export type Html2PdfParams = {
  rootEl: HTMLElement;
  options: Html2PdfOptions;
};
