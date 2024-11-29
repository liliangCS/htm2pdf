"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.html2Pdf = void 0;
const html2canvas_1 = __importDefault(require("html2canvas"));
const jspdf_1 = __importDefault(require("jspdf"));
const html2Pdf = ({ rootEl, options }) => {
    var _a, _b, _c, _d, _e, _f;
    const A4_WIDTH = 595;
    const A4_HEIGHT = 842;
    const filename = (_a = options.filename) !== null && _a !== void 0 ? _a : "default_filename.pdf";
    const splitClass = (_b = options.splitClass) !== null && _b !== void 0 ? _b : "";
    const nextPageHeaderMargin = (_c = options.nextPageHeaderMargin) !== null && _c !== void 0 ? _c : 0;
    const specialSplitClass = (_d = options.specialSplitClass) !== null && _d !== void 0 ? _d : [];
    const specialSplitTag = (_e = options.specialSplitTag) !== null && _e !== void 0 ? _e : [];
    const excludeSplitTag = (_f = options.excludeSplitTag) !== null && _f !== void 0 ? _f : [];
    let pageHeight = 0;
    let pageNum = 1;
    // check is splitClass and splitTag
    const _checkIsSpecialCt = (el) => {
        return ([...el.classList].some((item) => specialSplitClass.includes(item)) ||
            specialSplitTag.includes(el.tagName));
    };
    /**
     * If the content of the target element is cut,
     * add an empty div before the target element
     */
    const _addEmptyDiv = (targetEl, containerEl) => {
        var _a;
        if (excludeSplitTag.includes(targetEl.tagName))
            return;
        const rootElRect = rootEl.getBoundingClientRect();
        const targetElRect = targetEl.getBoundingClientRect();
        const distanceTop = targetElRect.top - rootElRect.top;
        const currentPage = Math.ceil((targetElRect.bottom - rootElRect.top) / pageHeight);
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
            (_a = options.onSplitBefore) === null || _a === void 0 ? void 0 : _a.call(options, targetEl);
        }
    };
    const _domEach = (el) => {
        [...el.children].forEach((childElement) => {
            if (childElement.childNodes.length &&
                (childElement.className.includes(splitClass) ||
                    _checkIsSpecialCt(childElement))) {
                _domEach(childElement);
            }
            else {
                _addEmptyDiv(childElement, el);
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
        const vpWidth = document.documentElement.clientWidth || document.body.clientWidth;
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
        ctx === null || ctx === void 0 ? void 0 : ctx.scale(2, 2);
        ctx === null || ctx === void 0 ? void 0 : ctx.translate(-rootEl.offsetLeft - abs, -rootEl.offsetTop);
        (0, html2canvas_1.default)(rootEl, { useCORS: true, scale: 1.5 }).then((canvas) => {
            var _a;
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
            const pdf = new jspdf_1.default({
                unit: "pt",
                format: "a4"
            });
            // 判断是否需要分页
            if (htmlHeight < pageHeight) {
                pdf.addImage(pageData, "JPEG", 0, 0, imgWidth, imgHeight);
            }
            else {
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
            (_a = options.onSplitAfter) === null || _a === void 0 ? void 0 : _a.call(options);
            resolve(true);
        });
    });
};
exports.html2Pdf = html2Pdf;
//# sourceMappingURL=index.js.map