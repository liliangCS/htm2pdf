import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Html2PdfParams } from "./type";

export const html2Pdf = ({ rootEl, options }: Html2PdfParams) => {
  const A4_WIDTH = 595;
  const A4_HEIGHT = 842;
  const filename = options.filename ?? "default_filename.pdf";
  const splitClass = options.splitClass ?? "";
  const nextPageHeaderMargin = options.nextPageHeaderMargin ?? 0;
  const specialSplitClass = options.specialSplitClass ?? [];
  const specialSplitTag = options.specialSplitTag ?? [];
  const excludeSplitTag = options.excludeSplitTag ?? [];
  const scale = options.scale ?? 1.5;
  let pageHeight = 0;
  let pageNum = 1;

  // check is splitClass and splitTag
  const _checkIsSpecialCt = (el: HTMLElement) => {
    return (
      [...el.classList].some((item) => specialSplitClass.includes(item)) ||
      specialSplitTag.includes(el.tagName)
    );
  };

  /**
   * If the content of the target element is cut,
   * add an empty div before the target element
   */
  const _addEmptyDiv = (targetEl: HTMLElement, containerEl: HTMLElement) => {
    if (excludeSplitTag.includes(targetEl.tagName)) return;
    const rootElRect = rootEl.getBoundingClientRect();
    const targetElRect = targetEl.getBoundingClientRect();
    const distanceTop = targetElRect.top - rootElRect.top;
    const currentPage = Math.ceil(
      (targetElRect.bottom - rootElRect.top) / pageHeight
    );
    if (currentPage > pageNum) {
      pageNum++;
      const newDivElement = document.createElement("div");
      newDivElement.className = "EMPTY_DIV";
      newDivElement.style.background = "#fff";
      newDivElement.style.height =
        pageHeight * (pageNum - 1) - distanceTop + nextPageHeaderMargin + "px";
      newDivElement.style.width = "100%";

      rootEl.style.position = "relative";
      const maskDivElement = document.createElement("div");
      maskDivElement.className = "EMPTY_DIV";
      maskDivElement.style.background = "#fff";
      maskDivElement.style.height =
        pageHeight * (pageNum - 1) - distanceTop + nextPageHeaderMargin + "px";
      maskDivElement.style.position = "absolute";
      maskDivElement.style.left = "0px";
      maskDivElement.style.right = "0px";
      maskDivElement.style.top = `${distanceTop}px`;
      maskDivElement.style.zIndex = "1";

      containerEl.insertBefore(newDivElement, targetEl);
      rootEl.appendChild(maskDivElement);
      options.onSplitBefore?.(targetEl);
    }
  };

  const _domEach = (el: HTMLElement) => {
    [...el.children].forEach((childElement) => {
      if (
        childElement.childNodes.length &&
        (childElement.className.includes(splitClass) ||
          _checkIsSpecialCt(childElement as HTMLElement))
      ) {
        _domEach(childElement as HTMLElement);
      } else {
        _addEmptyDiv(childElement as HTMLElement, el);
      }
    });
  };

  return new Promise((resolve) => {
    pageHeight = (A4_HEIGHT / A4_WIDTH) * rootEl.scrollWidth;
    rootEl.style.height = "max-content";
    _domEach(rootEl);
    const canvasEl = document.createElement("canvas");
    let abs = 0;
    // 获取当前窗口的宽度(不包括滚动条)
    const vpWidth =
      document.documentElement.clientWidth || document.body.clientWidth;
    // 获取当前窗口的宽度(包括滚动条)
    const winWidth = window.innerWidth;
    // 判断是否存在滚动条
    if (winWidth - vpWidth > 0) {
      abs = (winWidth - vpWidth) / 2;
    }
    // 画布 * 2
    canvasEl.width = rootEl.offsetWidth * 2;
    canvasEl.height = rootEl.scrollHeight * 2;
    const ctx = canvasEl.getContext("2d");
    // 增强图片清晰度
    ctx?.scale(2, 2);
    ctx?.translate(-rootEl.offsetLeft - abs, -rootEl.offsetTop);

    html2canvas(rootEl, { useCORS: true, scale: scale }).then((canvas) => {
      pageHeight = (A4_HEIGHT / A4_WIDTH) * canvas.width;
      // 定义未生成pdf的html页面高度
      let htmlHeight = canvas.height;
      // 定义页面偏移
      let position = 0;
      // 定义html页面生成的canvas在pdf中图片的宽高
      const imgWidth = A4_WIDTH;
      // ih / iw = ch / cw
      const imgHeight = (canvas.height / canvas.width) * imgWidth;
      const pageData = canvas.toDataURL("image/jpeg", 1.0);
      const pdf = new jsPDF({
        unit: "pt",
        format: "a4"
      });
      // 判断是否需要分页
      if (htmlHeight < pageHeight) {
        pdf.addImage(pageData, "JPEG", 0, 0, imgWidth, imgHeight);
      } else {
        while (htmlHeight > 0) {
          pdf.addImage(pageData, "JPEG", 0, position, imgWidth, imgHeight);
          htmlHeight -= pageHeight;
          position -= A4_HEIGHT;
          // 避免添加空白页
          if (htmlHeight > 0) {
            pdf.addPage();
          }
        }
      }
      pdf.save(filename, { returnPromise: true }).then(() => {
        const emptyDivElList = document.querySelectorAll(".EMPTY_DIV");
        for (let i = 0; i < emptyDivElList.length; i++) {
          emptyDivElList[i].remove();
        }
      });
      rootEl.style.height = "";
      options.onSplitAfter?.();
      resolve(true);
    });
  });
};
